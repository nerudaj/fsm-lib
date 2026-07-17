#pragma once

#include "fsm/Types.hpp"
#include "fsm/exports/ManifestExporterInterface.hpp"
#include "fsm/imports/ModelImporterInterface.hpp"

namespace fsm
{

template<BlackboardTypeConcept BbT>
class Factory
{
public:
    Factory(
        ManifestExporterInterface& manifestExporter,
        ModelImporterInterface& modelImporter);

public:
    void registerAction(const std::string& name, ActionConcept<BbT> auto&& action)
    {
        registeredActions.emplace(name, std::forward<decltype(action)>(action));
    }

    void registerCondition(const std::string& name, ConditionConcept<BbT> auto&& condition)
    {
        registeredConditions.emplace(name, std::forward<decltype(condition)>(condition));
    }

    /*fsm::Fsm<BbT> importFsm(const FsmModel& model) const;

    void exportManifest(std::ostream& os) const
    {
        writeManifest(os,
            registeredActions | std::views::keys | std::ranges::to<std::vector<std::string>>(),
            registeredConditions | std::views::keys | std::ranges::to<std::vector<std::string>>());
    }*/

private:
    ManifestExporterInterface& manifestExporter;
    ModelImporterInterface& modelImporter;
    std::unordered_map<std::string, detail::Action<BbT>> registeredActions;
    std::unordered_map<std::string, detail::Condition<BbT>> registeredConditions;
};

}