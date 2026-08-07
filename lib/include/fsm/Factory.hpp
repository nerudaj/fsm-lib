#pragma once

#include "fsm/Builder.hpp"
#include "fsm/Types.hpp"
#include "fsm/exports/ManifestExporterInterface.hpp"
#include "fsm/imports/ModelImporterInterface.hpp"

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

        fsm::Fsm<BbT> importFsm(ModelImporterInterface& modelImporter) const
        {
            auto&& modelResult = modelImporter.loadModel();
            auto&& model = modelResult.value();

            assert(model.version == 1);

            auto&& builder =
                fsm::Builder<BbT>().withNoErrorMachine().withMainMachine();

            auto states = stateMapToVector(model);

            return buildState<0>(states, builder).done().build();
        }

    private:
        template<size_t Idx>
        fsm::detail::MachineBuilder<BbT, false, false> buildState(
            const std::vector<
                std::pair<std::string, fsm::detail::FactoryFsmStateModel>>&
                states,
            auto&& builder) const
        {
            if (Idx == states.size() - 1) return builder;

            auto&& builderInternal = [&]()
            {
                if constexpr (Idx == 0)
                {
                    return builder.withEntryState(states[Idx].first.data());
                }
                else
                {
                    return builder.withState(states[Idx].first.data());
                }
            }();

            auto& model = states[Idx].second;
            if (model.transitions.empty())
            {
                return buildState<Idx + 1>(
                    states,
                    builderInternal.exec(registeredActions.at(model.actionName))
                        .andGoToState(model.destinationTargetName.data()));
            }
            else
            {
                return buildState<Idx + 1>(
                    states,
                    buildTransition(
                        1u,
                        model.transitions,
                        builderInternal
                            .when(registeredConditions.at(
                                model.transitions.front().conditionName))
                            .goToState(model.transitions.front()
                                           .destinationTargetName.data()))
                        .otherwiseExec(registeredActions.at(model.actionName))
                        .andGoToState(model.destinationTargetName.data()));
            }
        }

        auto buildTransition(
            size_t idx,
            const std::vector<fsm::detail::FactoryFsmTransitionModel>& model,
            auto&& builder) const
        {
            assert(idx > 0);

            auto&& newBuilder =
                builder
                    .orWhen(registeredConditions.at(model[idx].conditionName))
                    .goToState(model[idx].destinationTargetName.data());

            if (idx == model.size() - 1) return std::move(newBuilder);
            return std::move(buildTransition(idx + 1, model, newBuilder));
        }

        std::vector<std::pair<std::string, fsm::detail::FactoryFsmStateModel>>
        stateMapToVector(const fsm::detail::FactoryFsmModel& model) const
        {
            auto&& vec = model.states
                         | std::ranges::to<std::vector<std::pair<
                             std::string,
                             fsm::detail::FactoryFsmStateModel>>>();
            assert(!vec.empty());

            // make sure entry state is first
            auto&& itr = std::ranges::find_if(
                vec,
                [&model](const std::pair<
                         std::string,
                         fsm::detail::FactoryFsmStateModel>& pair)
                { return pair.first == model.entryStateName; });

            auto&& idx = std::distance(itr, vec.begin());

            std::swap(vec[0], vec[idx]);

            return vec;
        }

    private:
        std::unordered_map<std::string, detail::Action<BbT>> registeredActions;
        std::unordered_map<std::string, detail::Condition<BbT>>
            registeredConditions;
    };

} // namespace fsm
