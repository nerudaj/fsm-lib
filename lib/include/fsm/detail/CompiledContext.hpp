#pragma once

#include <cassert>
#include <fsm/Types.hpp>
#include <vector>

namespace fsm::detail
{
    class [[nodiscard]] CompiledTransition final
    {
    public:
        constexpr CompiledTransition(
            std::initializer_list<size_t> items) noexcept
        {
            assert(items.size() <= 2u);
            std::copy(items.begin(), items.end(), std::begin(data));
            size = items.size();
        }

        CompiledTransition(CompiledTransition&&) = default;
        CompiledTransition(const CompiledTransition&&) = delete;

    public:
        [[nodiscard]] constexpr auto begin(this auto&& self) noexcept
        {
            return std::begin(self.data);
        }

        [[nodiscard]] constexpr auto end(this auto&& self) noexcept
        {
            return std::begin(self.data) + self.size;
        }

        [[nodiscard]] constexpr size_t getSize() const noexcept
        {
            return size;
        }

        [[nodiscard]] constexpr bool isEmpty() const noexcept
        {
            return size == 0;
        }

        [[nodiscard]] constexpr auto&&
        operator[](this auto&& self, size_t index) noexcept
        {
            assert(index < self.size);
            return self.data[index];
        }

    private:
        size_t data[2] = { 0u, 0u };
        size_t size = 0;
    };

    template<BlackboardTypeConcept BbT>
    struct [[nodiscard]] CompiledConditionalTransition final
    {
        Condition<BbT> onConditionHit;
        CompiledTransition transition;
    };

    template<BlackboardTypeConcept BbT>
    struct [[nodiscard]] CompiledState final
    {
        std::vector<CompiledConditionalTransition<BbT>> conditionalTransitions;
        Action<BbT> executeBehavior;
        CompiledTransition defaultTransition;
    };
} // namespace fsm::detail
