#include "fsm/Factory.hpp"
#include "Blackboard.hpp"
#include "CsvParser.hpp"
#include "catch_amalgamated.hpp"
#include "fsm/imports/JsonModelImporter.hpp"

#define REGISTER_METHOD(x) #x, x

static std::string getTrivialV1Json()
{
    return R"({
    "version": 1,
    "entryStateName": "Start",
    "states": {
        "Start": {
            "actionName": "nothing",
            "destinationTargetName": "Start"
        }
    }
})";
}

TEST_CASE("Happy path", "[Factory]")
{
    auto&& factory = fsm::Factory<Blackboard>();

    factory.registerAction(REGISTER_METHOD(advanceChar));
    factory.registerAction(REGISTER_METHOD(storeWord));
    factory.registerAction(REGISTER_METHOD(startLine));
    factory.registerAction(REGISTER_METHOD(nothing));
    factory.registerCondition(REGISTER_METHOD(isEscapeChar));
    factory.registerCondition(REGISTER_METHOD(isSeparatorChar));
    factory.registerCondition(REGISTER_METHOD(isNewlineChar));
    factory.registerCondition(REGISTER_METHOD(isEof));
    factory.registerCondition(REGISTER_METHOD(isExclamationMark));
    factory.registerCondition(REGISTER_METHOD(alwaysTrue));

    SECTION("Loads trivial v1 model with single state with no transitions")
    {
        auto&& stream = std::stringstream(getTrivialV1Json());
        auto&& importer = fsm::JsonModelImporter(stream);
        auto&& fsm = factory.importFsm(importer);
        Blackboard bb;
        fsm.tick(bb);
    }
}

#undef REGISTER_METHOD
