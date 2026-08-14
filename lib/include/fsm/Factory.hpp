#pragma once

#include "fsm/Builder.hpp"
#include "fsm/Types.hpp"
#include "fsm/exports/ManifestExporterInterface.hpp"
#include "fsm/imports/ModelImporterInterface.hpp"
#include <expected>

namespace fsm
{

    template<BlackboardTypeConcept BbT>
    class [[nodiscard]] Factory final
    {
    public:
        void registerAction(
            const std::string& name, ActionConcept<BbT> auto&& action)
        {
            registeredActions.emplace(
                name, std::forward<decltype(action)>(action));
        }

        void registerCondition(
            const std::string& name, ConditionConcept<BbT> auto&& condition)
        {
            registeredConditions.emplace(
                name, std::forward<decltype(condition)>(condition));
        }

        void exportManifest(ManifestExporterInterface& manifestExporter)
        {
            manifestExporter.writeManifest(
                registeredActions | std::views::keys
                    | std::ranges::to<std::vector>(),
                registeredConditions | std::views::keys
                    | std::ranges::to<std::vector>());
        }

        std::expected<fsm::Fsm<BbT>, fsm::Error>
        importFsm(ModelImporterInterface& modelImporter) const
        {
            auto&& modelResult = modelImporter.loadModel();
            if (!modelResult)
                return std::unexpected(fsm::Error(
                    std::string("Could not load the model:\n")
                    + modelResult.error().what()));

            auto&& model = modelResult.value();

            if (model.version != 1)
                return std::unexpected(fsm::Error(
                    "Unsupported model version: "
                    + std::to_string(model.version)));

            // clang-format off
            auto&& builder = fsm::Builder<BbT>()
                .withErrorMachine()
                .noGlobalEntryCondition()
                    .withEntryState("Start")
                        .exec([](BbT&) {}).andLoop()
                    .done()
                .withMainMachine();
            // clang-format on

            auto&& states = stateMapToVector(model);

            try
            {
                return buildEntryStateThenAllOtherStates(states, builder)
                    .done()
                    .build();
            }
            catch (const std::exception& e)
            {
                return std::unexpected(fsm::Error(
                    std::string("Could not construct the FSM:\n") + e.what()));
            }
        }

    private:
        using StateNameModelPair =
            std::pair<std::string, fsm::detail::FactoryFsmStateModel>;

        fsm::detail::MachineBuilder<BbT, false, false>
        buildEntryStateThenAllOtherStates(
            const std::vector<StateNameModelPair>& states, auto&& builder) const
        {
            assert(!states.empty());
            return buildStates(
                1u,
                states,
                buildState(
                    states.front().second,
                    builder.withEntryState(states.front().first.data())));
        }

        fsm::detail::MachineBuilder<BbT, false, false> buildStates(
            size_t idx,
            const std::vector<StateNameModelPair>& states,
            auto&& builder) const
        {
            if (idx == states.size()) return builder;

            assert(0 <= idx && idx < states.size());

            return buildStates(
                idx + 1,
                states,
                buildState(
                    states[idx].second,
                    builder.withState(states[idx].first.data())));
        }

        auto buildState(
            const fsm::detail::FactoryFsmStateModel& model,
            auto&& builder) const
        {
            if (!registeredActions.contains(model.actionName))
            {
                throw fsm::Error(std::format(
                    "Model is referencing action called '{}', which was not "
                    "registered",
                    model.actionName));
            }

            if (model.transitions.empty())
            {
                return buildDefaultDestination(
                    model.destinationTargetName,
                    builder.exec(registeredActions.at(model.actionName)));
            }
            else
            {
                return buildDefaultDestination(
                    model.destinationTargetName,
                    buildTransitions(
                        1u,
                        model.transitions,
                        buildFirstTransition(
                            model.transitions.front(), builder))
                        .otherwiseExec(registeredActions.at(model.actionName)));
            }
        }

        auto buildTransitions(
            size_t idx,
            const std::vector<fsm::detail::FactoryFsmTransitionModel>& model,
            auto&& builder) const
        {
            assert(idx > 0);
            assert(idx <= model.size());

            if (idx == model.size()) return builder;
            return buildTransitions(
                idx + 1, model, buildNthTransition(model[idx], builder));
        }

        auto buildFirstTransition(
            const fsm::detail::FactoryFsmTransitionModel& transition,
            auto&& builder) const
        {
            if (!registeredConditions.contains(transition.conditionName))
            {
                throw fsm::Error(std::format(
                    "Model is referencing condition called '{}', which was not "
                    "registered",
                    transition.conditionName));
            }

            return buildDestination(
                transition.destinationTargetName,
                builder.when(
                    registeredConditions.at(transition.conditionName)));
        }

        auto buildNthTransition(
            const fsm::detail::FactoryFsmTransitionModel& transition,
            auto&& builder) const
        {
            if (!registeredConditions.contains(transition.conditionName))
            {
                throw fsm::Error(std::format(
                    "Model is referencing condition called '{}', which was not "
                    "registered",
                    transition.conditionName));
            }

            return buildDestination(
                transition.destinationTargetName,
                builder.orWhen(
                    registeredConditions.at(transition.conditionName)));
        }

        auto buildDefaultDestination(
            const std::string& targetName, auto&& builder) const
        {
            if (targetName == "__error__")
                throw fsm::Error("Cannot error out from a default transition");
            else if (targetName == "__finish__")
                return builder.andFinish();
            return builder.andGoToState(targetName.data());
        }

        auto
        buildDestination(const std::string& targetName, auto&& builder) const
        {
            if (targetName == "__error__")
                return builder.error();
            else if (targetName == "__finish__")
                return builder.finish();
            return builder.goToState(targetName.data());
        }

        std::vector<StateNameModelPair>
        stateMapToVector(const fsm::detail::FactoryFsmModel& model) const
        {
            auto&& vec = model.states
                         | std::ranges::to<std::vector<std::pair<
                             std::string,
                             fsm::detail::FactoryFsmStateModel>>>();
            assert(vec.size() == model.states.size());

            // make sure entry state is first
            auto&& itr = std::ranges::find_if(
                vec,
                [&model](const std::pair<
                         std::string,
                         fsm::detail::FactoryFsmStateModel>& pair)
                { return pair.first == model.entryStateName; });

            auto&& idx = std::distance(vec.begin(), itr);
            assert(0 <= idx && idx < vec.size());

            std::swap(vec[0], vec[idx]);

            return vec;
        }

    private:
        std::unordered_map<std::string, detail::Action<BbT>> registeredActions;
        std::unordered_map<std::string, detail::Condition<BbT>>
            registeredConditions;
    };

} // namespace fsm
