#pragma once

#include <map>
#include <string>
#include <vector>

namespace fsm::detail
{

    struct [[nodiscard]] FactoryFsmTransitionModel final
    {
        std::string conditionName;
        std::string destinationTargetName;
    };

    struct [[nodiscard]] FactoryFsmStateModel final
    {
        std::vector<FactoryFsmTransitionModel> transitions;
        std::string actionName;
        std::string destinationTargetName;
    };

    struct [[nodiscard]] FactoryFsmModel final
    {
        int version = 1;
        std::string entryStateName;
        std::map<std::string, FactoryFsmStateModel> states;
    };

} // namespace fsm::detail
