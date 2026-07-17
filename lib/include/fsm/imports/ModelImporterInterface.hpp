#pragma once

#include "fsm/detail/FactoryFsmModel.hpp"
#include "fsm/Error.hpp"
#include <expected>

namespace fsm
{

class [[nodiscard]] ModelImporterInterface
{
public:
    ModelImporterInterface() = default;
    ModelImporterInterface(const ModelImporterInterface&) = delete;
    ModelImporterInterface(ModelImporterInterface&&) = delete;
    virtual ~ModelImporterInterface() = default;

public:
    virtual std::expected<fsm::detail::FactoryFsmModel, fsm::Error> loadModel() = 0;
};

}
