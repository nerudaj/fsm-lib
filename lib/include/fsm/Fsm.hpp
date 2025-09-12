#pragma once

#include <cassert>
#include <format>
#include <fsm/Error.hpp>
#include <fsm/Types.hpp>
#include <fsm/detail/BuilderContext.hpp>
#include <fsm/detail/Compiler.hpp>
#include <fsm/detail/Helper.hpp>
#include <fsm/detail/StateIndex.hpp>
#include <fsm/logging/LoggerInterface.hpp>
#include <fsm/logging/NullLogger.hpp>
#include <iostream>
#include <map>
#include <optional>
#include <ostream>
#include <print>
#include <ranges>
#include <string>
#include <utility>
#include <version>

namespace fsm
{
    /**
     * \brief Class representing hierarchical finite state machine
     *
     * \note This class can only be constructed through fsm::Builder
     *
     * This class is the model of the specified FSM. It contains definitions
     * for states, transitions, submachines, etc. But it has no context of what
     * is currently processed state. This state is stored in a 'Blackboard'
     * class (anything that passes BlackboardTypeConcept constraint).
     *
     * The reason for this is that a single FSM model can be used to update
     * multiple AI agents, each with their own Blackboard.
     *
     * Each Blackboard needs to be initialized before start of the simulation
     * (\see initBlackboard). After that, you can \see tick the machine until
     * \see isFinished.
     */
    template<BlackboardTypeConcept BbT>
    class [[nodiscard]] Fsm final
    {
    public:
        Fsm(const detail::StateIndex& index,
            detail::BuilderContext<BbT>&& context)
            : stateIdToName(index.getIndexedStateNames())
            , states(detail::Compiler::compileMachine(context, index))
            , errorStateEndIdx(detail::getErrorStatesCount(context) + 1)
            , globalErrorTransition(
                  detail::Compiler::compileGlobalErrorTransition<BbT>(
                      context, index))
        {
        }

        Fsm(Fsm&&) = delete;
        Fsm(const Fsm&) = delete;

    public:
        void setLogger(LoggerInterface& _logger)
        {
            logger = _logger;
        }

        /**
         * Perform single update 'tick'. Tick means evaluating the current
         * state stored in the blackboard. If one of the conditions for
         * transition is fulfilled, the transition is taken (changing the
         * current state). If no condition is fulfilled, state behavior (action)
         * is triggered and then default transition is taken.
         *
         * If global error condition was specified, it is evaluated before
         * evaluating the current state, possibly transitioning to the error
         * machine.
         *
         * If the machine finished (\see isFinished), the function does nothing.
         */
        void tick(BbT& blackboard)
        {
            if (blackboard.__stateIdxs.empty()) return;

            auto start = std::chrono::high_resolution_clock::now();

            auto currentStateIdx = detail::popTopState(blackboard);
            assert(currentStateIdx < states.size());
            auto& state = states[currentStateIdx];

            auto log = [&](const std::string& message,
                           const std::string& targetStateName)
            {
                auto duration =
                    std::chrono::duration_cast<std::chrono::microseconds>(
                        std::chrono::high_resolution_clock::now() - start);

                logger.get().log(
                    reinterpret_cast<std::uintptr_t>(this),
                    stateIdToName[currentStateIdx],
                    blackboard,
                    message,
                    targetStateName,
                    duration);
            };

#define _BIND(x) [&] { return x(blackboard, state); }

            std::optional<Log> result =
                evaluateGlobalErrorCondition(blackboard, currentStateIdx)
                    .or_else(_BIND(evaluateStateConditions))
                    .or_else(_BIND(evaluateDefaultTransition));

#undef _BIND

            log(result.value().message, result.value().targetStateName);
        }

        /**
         * Check if the machine finished, or 'accepted'. Uninitialized
         * blackboard (\see initBlackboard) is also considered as finished.
         */
        [[nodiscard]] constexpr bool
        isFinished(const BbT& blackboard) const noexcept
        {
            return blackboard.__stateIdxs.empty();
        }

        /**
         * Check if the machine is in error submachine.
         */
        [[nodiscard]] constexpr bool
        isErrored(const BbT& blackboard) const noexcept
        {
            return !blackboard.__stateIdxs.empty()
                   && isErrorStateIdx(blackboard.__stateIdxs.back());
        }

    private:
        struct Log
        {
            std::string message;
            std::string targetStateName;
        };

    private:
        std::optional<Log>
        evaluateGlobalErrorCondition(BbT& blackboard, size_t currentStateIdx)
        {
            if (isErrorStateIdx(currentStateIdx)
                || !globalErrorTransition.onConditionHit(blackboard))
                return std::nullopt;

            blackboard.__stateIdxs.clear();
            detail::executeTransition(
                blackboard, globalErrorTransition.transition);

            return Log {
                .message = "Global error condition hit",
                .targetStateName = getTransitionLog(
                    globalErrorTransition.transition, blackboard),
            };
        }

        std::optional<Log> evaluateStateConditions(
            BbT& blackboard, const detail::CompiledState<BbT>& state)
        {
#ifdef __cpp_lib_ranges_enumerate
            for (const auto& [idx, condition] :
                 std::views::enumerate(state.conditionalTransitions))
#else
            for (const auto& [idx, condition] : std::views::zip(
                     std::views::iota(0u, state.conditionalTransitions.size()),
                     state.conditionalTransitions))
#endif
            {
                if (condition.onConditionHit(blackboard))
                {
                    if (isErrorTransition(condition.transition))
                    {
                        blackboard.__stateIdxs.clear();
                    }

                    detail::executeTransition(blackboard, condition.transition);

                    return Log {
                        .message = std::format("Condition {} hit", idx),
                        .targetStateName =
                            getTransitionLog(condition.transition, blackboard),
                    };
                }
            }

            return std::nullopt;
        }

        std::optional<Log> evaluateDefaultTransition(
            BbT& blackboard, const detail::CompiledState<BbT>& state)
        {
            state.executeBehavior(blackboard);
            detail::executeTransition(blackboard, state.defaultTransition);

            return Log {
                .message = "Behavior executed",
                .targetStateName =
                    getTransitionLog(state.defaultTransition, blackboard),
            };
        }

        std::string getTransitionLog(
            const detail::CompiledTransition& transition, const BbT& blackboard)
        {
            if (transition.isEmpty())
                if (blackboard.__stateIdxs.empty())
                    return "Finishing";
                else
                    return stateIdToName[blackboard.__stateIdxs.back()];
            else if (transition.getSize() == 1u)
                return stateIdToName[transition[0]];
            return stateIdToName[transition[0]];
        }

        [[nodiscard]] constexpr bool isErrorStateIdx(size_t idx) const noexcept
        {
            return 0 < idx && idx < errorStateEndIdx;
        }

        [[nodiscard]] constexpr bool isErrorTransition(
            const detail::CompiledTransition& transition) const noexcept
        {
            return transition.getSize() == 1u && isErrorStateIdx(transition[0]);
        }

    private:
        NullLogger defaultLogger = NullLogger();
        std::reference_wrapper<LoggerInterface> logger = defaultLogger;
        std::vector<std::string> stateIdToName;
        std::vector<detail::CompiledState<BbT>> states;
        size_t errorStateEndIdx = 0;
        detail::CompiledConditionalTransition<BbT> globalErrorTransition;
    };
} // namespace fsm
