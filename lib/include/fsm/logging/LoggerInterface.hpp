#pragma once

#include <chrono>
#include <format>
#include <fsm/Types.hpp>
#include <string>

namespace fsm
{
    class [[nodiscard]] LoggerInterface
    {
    public:
        virtual ~LoggerInterface() = default;

    public:
        /**
         *  Emit log from the FSM
         *
         *  \param fsmId  Id of the FSM in form of its address
         *  \param currentStateName  Name of the FSM state that is currently
         * being ticked \param blackboard  Blackboard that is being updated
         *  \param message  Verbose message about what is happening
         *  \param targetStateName  Name of the state the FSM will transition to
         *  \param duration  Duration of the fsm::tick (optional)
         */
        template<BlackboardTypeConcept BlackboardType>
        void
        log(const std::uintptr_t fsmId,
            const std::string& currentStateName,
            const BlackboardType& blackboard,
            const std::string& message,
            const std::string& targetStateName,
            std::chrono::duration<long long, std::micro> duration =
                std::chrono::duration<long long, std::micro>::zero())
        {
            if constexpr (IsFormatterSpecializedForBlackboard<
                              BlackboardType,
                              char>::value)
            {
                logImplementation(Log {
                    .machineId = std::format("{:#x}", fsmId),
                    .blackboardId =
                        blackboard.__debugId.empty()
                            ? std::format(
                                  "{:#x}",
                                  reinterpret_cast<std::uintptr_t>(&blackboard))
                            : blackboard.__debugId,
                    .blackboardLog = std::format("{}", blackboard),
                    .message = message,
                    .currentStateName = currentStateName,
                    .targetStateName = targetStateName,
                    .duration = duration,
                });
            }
            else
            {
                logImplementation(Log {
                    .machineId = std::format("{:#x}", fsmId),
                    .blackboardId =
                        blackboard.__debugId.empty()
                            ? std::format(
                                  "{:#x}",
                                  reinterpret_cast<std::uintptr_t>(&blackboard))
                            : blackboard.__debugId,
                    .blackboardLog = "",
                    .message = message,
                    .currentStateName = currentStateName,
                    .targetStateName = targetStateName,
                    .duration = duration,
                });
            }
        }

    protected:
        struct Log
        {
            std::string machineId;
            std::string blackboardId;
            std::string blackboardLog;
            std::string message;
            std::string currentStateName;
            std::string targetStateName;
            std::chrono::duration<long long, std::micro> duration;
        };

        virtual void logImplementation(const Log& log) = 0;
    };
} // namespace fsm
