#pragma once

#include "Blackboard.hpp"

static constexpr bool isEscapeChar(const Blackboard& bb)
{
    return bb.data[bb.charIdx] == '"';
}

static constexpr bool isSeparatorChar(const Blackboard& bb)
{
    return bb.data[bb.charIdx] == ',';
}

static constexpr bool isNewlineChar(const Blackboard& bb)
{
    return bb.data[bb.charIdx] == '\n';
}

static constexpr bool isEof(const Blackboard& bb) noexcept
{
    return bb.data.size() == bb.charIdx;
}

static constexpr bool isExclamationMark(const Blackboard& bb) noexcept
{
    return bb.data[bb.charIdx] == '!';
}

static constexpr void advanceChar(Blackboard& bb)
{
    ++bb.charIdx;
}

static constexpr void storeWord(Blackboard& bb)
{
    bb.csv.back().push_back(
        bb.data.substr(bb.wordStartIdx, bb.charIdx - bb.wordStartIdx));
    bb.wordStartIdx = bb.charIdx + 1;
}

static constexpr void startLine(Blackboard& bb)
{
    bb.csv.push_back({});
}

static constexpr void nothing(Blackboard&) noexcept {}

static constexpr bool alwaysTrue(const Blackboard&) noexcept
{
    return true;
}

static constexpr bool alwaysFalse(const Blackboard&) noexcept
{
    return false;
}