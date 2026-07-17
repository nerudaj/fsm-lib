#pragma once

#include "fsm/imports/ModelImporterInterface.hpp"
#include <istream>

namespace fsm
{

class [[nodiscard]] JsonModelImporter final : public ModelImporterInterface
{
public:
    explicit JsonModelImporter(std::istream& is) noexcept;
    JsonModelImporter(JsonModelImporter&&) = delete;
    JsonModelImporter(const JsonModelImporter&) = delete;

public:
    std::expected<fsm::detail::FactoryFsmModel, fsm::Error> loadModel() override;

private:
    std::istream& is;
};

}
