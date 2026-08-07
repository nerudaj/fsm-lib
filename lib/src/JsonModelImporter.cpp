#include "fsm/imports/JsonModelImporter.hpp"
#include <nlohmann/json.hpp>

namespace fsm::detail
{
    void from_json(const nlohmann::json& j, FactoryFsmTransitionModel& model)
    {
        if (!j.contains("conditionName"))
        {
            throw fsm::Error(
                "conditionName missing for transition of one of the states");
        }
        else if (!j.contains("destinationTargetName"))
        {
            throw fsm::Error(
                "destinationTargetName missing for transition of one of the "
                "states");
        }

        j["conditionName"].get_to(model.conditionName);
        j["destinationTargetName"].get_to(model.destinationTargetName);
    }

    void from_json(const nlohmann::json& j, FactoryFsmStateModel& model)
    {
        if (j.contains("transitions"))
        {
            j["transitions"].get_to(model.transitions);
        }

        if (!j.contains("actionName"))
        {
            throw fsm::Error("actionName is missing for one of the states");
        }
        else if (!j.contains("destinationTargetName"))
        {
            throw fsm::Error(
                "destinationTargetName is missing for one of the states");
        }

        j["actionName"].get_to(model.actionName);
        j["destinationTargetName"].get_to(model.destinationTargetName);
    }
} // namespace fsm::detail

void from_json(const nlohmann::json& j, fsm::detail::FactoryFsmModel& model)
{
    if (!j.contains("version"))
        throw fsm::Error("Model does not contain version");
    else if (!j.contains("entryStateName"))
        throw fsm::Error("Model does not contain entryStateName");
    else if (!j.contains("states"))
        throw fsm::Error("Model does not contain states");

    j["version"].get_to(model.version);
    j["entryStateName"].get_to(model.entryStateName);
    j["states"].get_to(model.states);
}

fsm::JsonModelImporter::JsonModelImporter(std::istream& is) noexcept : is(is) {}

std::expected<fsm::detail::FactoryFsmModel, fsm::Error>
fsm::JsonModelImporter::loadModel()
{
    nlohmann::json json;
    is >> json;
    auto&& model = fsm::detail::FactoryFsmModel();

    try
    {
        from_json(json, model);
    }
    catch (const fsm::Error& e)
    {
        return std::unexpected(e);
    }

    if (model.version != 1)
        return std::unexpected(
            fsm::Error(
                "Version " + std::to_string(model.version)
                + " is not supported"));
    else if (model.entryStateName.empty())
        return std::unexpected(fsm::Error("entryStateName is empty"));
    else if (model.states.empty())
        return std::unexpected(fsm::Error("states are empty"));
    else if (!model.states.contains(model.entryStateName))
        return std::unexpected(
            fsm::Error("states are missing the entry state"));

    for (auto&& [name, state] : model.states)
    {
        for (auto&& transition : state.transitions)
        {
            if (transition.conditionName.empty())
                return std::unexpected(
                    fsm::Error(
                        "One of conditions of state " + name
                        + " has empty name"));
            else if (transition.destinationTargetName.empty())
                return std::unexpected(
                    fsm::Error(
                        "Condition " + transition.conditionName + " of state "
                        + name + " has empty destinationTargetName"));
        }

        if (state.actionName.empty())
            return std::unexpected(
                fsm::Error("actionName of state " + name + " is empty"));
        else if (state.destinationTargetName.empty())
            return std::unexpected(
                fsm::Error(
                    "State " + name + " has empty destinationTargetName"));
    }

    return model;
}
