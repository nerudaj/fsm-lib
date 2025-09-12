#pragma once

#include <format>
#include <fsm/Types.hpp>
#include <string>
#include <vector>

struct Blackboard : fsm::BlackboardBase
{
    std::string data = "";
    size_t charIdx = 0;
    size_t wordStartIdx = 0;
    std::vector<std::vector<std::string>> csv = { {} };
};

template<class CharT>
struct std::formatter<Blackboard, CharT>
{
    template<class ParseContext>
    constexpr auto parse(ParseContext& ctx)
    {
        return ctx.begin();
    }

    template<class FormatContext>
    constexpr auto format(const Blackboard& bb, FormatContext& ctx) const
    {
        return std::format_to(
            ctx.out(),
            "Blackboard: [ charIdx: {}; wordStartIdx: {}; |csv| = {}; "
            "|csv.back()| = {} ]",
            bb.charIdx,
            bb.wordStartIdx,
            bb.csv.size(),
            bb.csv.back().size());
    }
};

struct NonLoggableBlackboard : fsm::BlackboardBase
{
};
