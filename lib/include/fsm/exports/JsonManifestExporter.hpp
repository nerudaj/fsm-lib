#pragma once

#include "fsm/exports/ManifestExporterInterface.hpp"
#include <vector>
#include <string>
#include <iostream>
#include <ostream>

namespace fsm
{

class [[nodiscard]] JsonManifestExporter final : public ManifestExporterInterface
{
public:
    explicit JsonManifestExporter(std::ostream& os = std::cout) noexcept;
    JsonManifestExporter(JsonManifestExporter&&) = delete;
    JsonManifestExporter(const JsonManifestExporter&) = delete;

public:
    void writeManifest(
        const std::vector<std::string>& actionNames,
        const std::vector<std::string>& conditionNames) override;

private:
    std::ostream& os;
};

}
