#pragma once

#include <concepts>
#include <format>
#include <functional>
#include <type_traits>
#include <utility>
#include <vector>

namespace fsm
{
    /**
     * \brief Base class for blackboard
     *
     * Each blackboard class needs to hold some context
     * specific for the FSM model. This context is stored
     * in the base class, you just need to inherit it publicly
     * for your Blackboard class.
     */
    struct [[nodiscard]] BlackboardBase
    {
        // 0u is guaranteed to be the entry point of the machine
        std::vector<size_t> __stateIdxs = { size_t {} };
        std::string __debugId = "";

        void SetDebugId(const std::string& id)
        {
            __debugId = id;
        }
    };

    /**
     * \brief Constraint that checks if a class was derived from BlackboardBase
     */
    template<class T>
    concept BlackboardTypeConcept = std::derived_from<T, BlackboardBase>;

    // Helper to detect if std::formatter<T, CharT> is specialized
    template<typename T, typename CharT, typename = void>
    struct IsFormatterSpecializedForBlackboard : std::false_type
    {
    };

    template<typename T, typename CharT>
    struct IsFormatterSpecializedForBlackboard<
        T,
        CharT,
        std::void_t<decltype(std::formatter<T, CharT> {})>> : std::true_type
    {
    };

    template<class Callable, class BlackboardType>
    concept ConditionConcept =
        requires(Callable&& fn, const BlackboardType& bb) {
            { fn(bb) } -> std::same_as<bool>;
        } && BlackboardTypeConcept<BlackboardType>;

    template<class Callable, class BlackboardType>
    concept ActionConcept = requires(Callable&& fn, BlackboardType& bb) {
        { fn(bb) } -> std::same_as<void>;
    } && BlackboardTypeConcept<BlackboardType>;

    namespace detail
    {
        template<BlackboardTypeConcept BbT>
        using Action = std::function<void(BbT&)>;

        template<BlackboardTypeConcept BbT>
        using Condition = std::function<bool(const BbT&)>;
    } // namespace detail
} // namespace fsm
