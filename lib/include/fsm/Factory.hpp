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

            return buildState(
                       builder.withEntryState(model.entryStateName.data()),
                       model.states.at(model.entryStateName))
                .done()
                .build();
        }

    private:
        auto buildState(
            auto&& builder,
            const fsm::detail::FactoryFsmStateModel& model) const
        {
            if (model.transitions.empty())
            {
                return builder.exec(registeredActions.at(model.actionName))
                    .andGoToState(model.destinationTargetName.data());
            }
            else
            {
                auto&& stateBuilder =
                    builder
                        .when(registeredConditions.at(
                            model.transitions.front().conditionName))
                        .goToState(model.transitions.front()
                                       .destinationTargetName.data());

                return buildTransition(1u, model.transitions, stateBuilder)
                    .otherwiseExec(registeredActions.at(model.actionName))
                    .andGoToState(model.destinationTargetName.data());
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

    private:
        std::unordered_map<std::string, detail::Action<BbT>> registeredActions;
        std::unordered_map<std::string, detail::Condition<BbT>>
            registeredConditions;
    };

} // namespace fsm
