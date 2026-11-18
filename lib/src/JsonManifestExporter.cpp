#include "fsm/exports/JsonManifestExporter.hpp"
#include <nlohmann/json.hpp>

struct [[nodiscard]] ManifestSchema final
{
    int version = 1;
    std::vector<std::string> actions;
    std::vector<std::string> conditions;
};

NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(ManifestSchema, version, actions, conditions);

fsm::JsonManifestExporter::JsonManifestExporter(std::ostream& os) noexcept
    : os(os)
{}

void fsm::JsonManifestExporter::writeManifest(
    const std::vector<std::string>& actionNames,
    const std::vector<std::string>& conditionNames)
{
    auto&& manifest = ManifestSchema
    {
        .actions = actionNames,
        .conditions = conditionNames,
    };

    os << nlohmann::json(manifest);
}
