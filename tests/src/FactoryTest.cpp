#include "fsm/Factory.hpp"
#include "Blackboard.hpp"
#include "CsvParser.hpp"
#include "catch_amalgamated.hpp"
#include "fsm/imports/JsonModelImporter.hpp"
#include <print>

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

static std::string getV1WithTransitions()
{
    return R"({
    "version": 1,
    "entryStateName": "Start",
    "states": {
        "Start": {
            "transitions": [
                {
                    "conditionName": "isEof",
                    "destinationTargetName": "Eof"
                },
                {
                    "conditionName": "isSeparatorChar",
                    "destinationTargetName": "Comma"
                }
            ],
            "actionName": "advanceChar",
            "destinationTargetName": "Start"
        },
        "Eof": {
            "actionName": "nothing",
            "destinationTargetName": "Eof"
        },
        "Comma": {
            "actionName": "storeWord",
            "destinationTargetName": "Start"
        }
    }
})";
}

static std::string getJsonWithError()
{
    return R"({
    "version": 1,
    "entryStateName": "Start",
    "states": {
        "Start": {
            "transitions": [
                {
                    "conditionName": "alwaysTrue",
                    "destinationTargetName": "__error__"
                }
            ],
            "actionName": "nothing",
            "destinationTargetName": "Start"
        }
    }
})";
}

static std::string getJsonWithFinish()
{
    return R"({
    "version": 1,
    "entryStateName": "Start",
    "states": {
        "Start": {
            "actionName": "nothing",
            "destinationTargetName": "__finish__"
        }
    }
})";
}

static std::string getJsonWithErrorInDefault()
{
    return R"({
    "version": 1,
    "entryStateName": "Start",
    "states": {
        "Start": {
            "actionName": "nothing",
            "destinationTargetName": "__finish__"
        }
    }
})";
}

static fsm::Factory<Blackboard> makeFactory()
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

    return factory;
}

TEST_CASE("Happy path", "[Factory]")
{
    auto&& factory = makeFactory();

    SECTION("Loads trivial v1 model with single state with no transitions")
    {
        auto&& stream = std::stringstream(getTrivialV1Json());
        auto&& importer = fsm::JsonModelImporter(stream);
        auto&& fsmResult = factory.importFsm(importer);
        REQUIRE(fsmResult);
        auto&& fsm = fsmResult.value();

        Blackboard bb;
        fsm.tick(bb);
    }

    SECTION("Loads trivial v1 with a bunch of transitions")
    {
        auto&& stream = std::stringstream(getV1WithTransitions());
        auto&& importer = fsm::JsonModelImporter(stream);
        auto&& fsmResult = factory.importFsm(importer);
        REQUIRE(fsmResult);
        auto&& fsm = fsmResult.value();

        auto&& bb = Blackboard {
            .data = "acb,def",
        };
        fsm.tick(bb);
        fsm.tick(bb);
        fsm.tick(bb);
        fsm.tick(bb);
        fsm.tick(bb);
    }

    SECTION("Supports basic error() into NOP error machine")
    {
        auto&& stream = std::stringstream(getJsonWithError());
        auto&& importer = fsm::JsonModelImporter(stream);
        auto&& fsmResult = factory.importFsm(importer);
        REQUIRE(fsmResult);
        auto&& fsm = fsmResult.value();

        Blackboard bb;
        REQUIRE_FALSE(fsm.isErrored(bb));
        fsm.tick(bb);
        REQUIRE(fsm.isErrored(bb));
    }

    SECTION("Supports finish()")
    {
        auto&& stream = std::stringstream(getJsonWithFinish());
        auto&& importer = fsm::JsonModelImporter(stream);
        auto&& fsmResult = factory.importFsm(importer);
        REQUIRE(fsmResult);
        auto&& fsm = fsmResult.value();

        Blackboard bb;
        REQUIRE_FALSE(fsm.isFinished(bb));
        fsm.tick(bb);
        REQUIRE(fsm.isFinished(bb));
    }
}

TEST_CASE("Validation fails", "[Factory]")
{
    auto&& factory = makeFactory();

    SECTION("Model uses not registered action")
    {
        auto&& json = R"({
    "version": 1,
    "entryStateName": "Start",
    "states": {
        "Start": {
            "actionName": "doNothing",
            "destinationTargetName": "Start"
        }
    }
})";
        auto&& stream = std::stringstream(json);
        auto&& importer = fsm::JsonModelImporter(stream);
        auto&& fsm = factory.importFsm(importer);

        REQUIRE_FALSE(fsm);

        std::println(std::cerr, "----------------------");
        std::println(std::cerr, "{}", fsm.error().what());
        std::println(std::cerr, "----------------------");

        REQUIRE(std::string(fsm.error().what())
                    .contains("Model is referencing action called 'doNothing', "
                              "which was not registered"));
    }

    SECTION("Model uses not registered condition")
    {
        auto&& json = R"({
    "version": 1,
    "entryStateName": "Start",
    "states": {
        "Start": {
            "transitions": [
                {
                    "conditionName": "undefined",
                    "destinationTargetName": "__error__"
                }
            ],
            "actionName": "nothing",
            "destinationTargetName": "Start"
        }
    }
})";
        auto&& stream = std::stringstream(json);
        auto&& importer = fsm::JsonModelImporter(stream);
        auto&& fsm = factory.importFsm(importer);

        REQUIRE_FALSE(fsm);

        std::println(std::cerr, "----------------------");
        std::println(std::cerr, "{}", fsm.error().what());
        std::println(std::cerr, "----------------------");

        REQUIRE(
            std::string(fsm.error().what())
                .contains("Model is referencing condition called 'undefined', "
                          "which was not registered"));
    }

    SECTION("Cannot error-out from default transition")
    {
        auto&& json = R"({
    "version": 1,
    "entryStateName": "Start",
    "states": {
        "Start": {
            "actionName": "nothing",
            "destinationTargetName": "__error__"
        }
    }
})";
        auto&& stream = std::stringstream(json);
        auto&& importer = fsm::JsonModelImporter(stream);
        auto&& fsm = factory.importFsm(importer);

        REQUIRE_FALSE(fsm);
        REQUIRE(std::string(fsm.error().what())
                    .contains("Cannot error out from a default transition"));
    }

    SECTION("Referencing non-existent state name as destination")
    {
        auto&& json = R"({
    "version": 1,
    "entryStateName": "Start",
    "states": {
        "Start": {
            "transitions": [
                {
                    "conditionName": "alwaysTrue",
                    "destinationTargetName": "NotDefinedState"
                }
            ],
            "actionName": "nothing",
            "destinationTargetName": "Start"
        }
    }
})";
        auto&& stream = std::stringstream(json);
        auto&& importer = fsm::JsonModelImporter(stream);
        auto&& fsm = factory.importFsm(importer);

        REQUIRE_FALSE(fsm);

        std::println(std::cerr, "----------------------");
        std::println(std::cerr, "{}", fsm.error().what());
        std::println(std::cerr, "----------------------");

        REQUIRE(std::string(fsm.error().what())
                    .contains("NotDefinedState has not been defined"));
    }
}

#undef REGISTER_METHOD
