#pragma once

#include <vector>
#include <string>

class [[nodiscard]] ManifestExporterInterface 
{
public:
    ManifestExporterInterface() = default;
    ManifestExporterInterface(ManifestExporterInterface&&) = delete;
    ManifestExporterInterface(const ManifestExporterInterface&) = delete;
    virtual ~ManifestExporterInterface() = default;

public:
    virtual void writeManifest(
        const std::vector<std::string>& actionNames,
        const std::vector<std::string>& conditionNames) = 0;
};
