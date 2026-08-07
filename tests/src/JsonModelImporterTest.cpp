#include "fsm/imports/JsonModelImporter.hpp"
#include "catch_amalgamated.hpp"

std::expected<fsm::detail::FactoryFsmModel, fsm::Error>
loadModelFromString(const std::string& str)
{
    auto&& sstream = std::stringstream(str);
    auto&& importer = fsm::JsonModelImporter(sstream);
    return importer.loadModel();
}

bool containsSubstr(const std::string& src, std::string_view substr)
{
    return src.find(substr) != std::string::npos;
}

TEST_CASE("Happy path", "[JsonModelImporter]")
{
    std::string v1Json = R"({
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
                    "conditionName": "isComma",
                    "destinationTargetName": "Comma"
                }
            ],
            "actionName": "advanceChar",
            "destinationTargetName": "Start"
        },
        "Eof": {
            "actionName": "doNothing",
            "destinationTargetName": "Eof"
        },
        "Comma": {
            "actionName": "storeWord",
            "destinationTargetName": "Start"
        }
    }
})";

    SECTION("Can load v1 schema")
    {
        auto&& result = loadModelFromString(v1Json);
        REQUIRE(result);
        auto&& model = result.value();

        REQUIRE(model.version == 1);
        REQUIRE(model.entryStateName == "Start");
        REQUIRE(model.states.size() == 3u);

        REQUIRE(model.states["Start"].transitions.size() == 2u);
        REQUIRE(model.states["Start"].transitions[0].conditionName == "isEof");
        REQUIRE(
            model.states["Start"].transitions[0].destinationTargetName
            == "Eof");
        REQUIRE(
            model.states["Start"].transitions[1].conditionName == "isComma");
        REQUIRE(
            model.states["Start"].transitions[1].destinationTargetName
            == "Comma");
        REQUIRE(model.states["Start"].actionName == "advanceChar");
        REQUIRE(model.states["Start"].destinationTargetName == "Start");

        REQUIRE(model.states["Eof"].transitions.empty());
        REQUIRE(model.states["Eof"].actionName == "doNothing");
        REQUIRE(model.states["Eof"].destinationTargetName == "Eof");

        REQUIRE(model.states["Comma"].transitions.empty());
        REQUIRE(model.states["Comma"].actionName == "storeWord");
        REQUIRE(model.states["Comma"].destinationTargetName == "Start");
    }

    // TODO: validation
}

TEST_CASE("Validation failed", "[JsonModelImporter]")
{
    SECTION("Version is missing")
    {
        std::string json = R"({
    "entryStateName": "Start",
    "states": {
        "Start": {
            "transitions": [],
            "actionName": "advanceChar",
            "destinationTargetName": "Start"
        }
    }
})";

        auto&& result = loadModelFromString(json);
        REQUIRE_FALSE(result);
        REQUIRE(containsSubstr(
            result.error().what(), "Model does not contain version"));
    }

    SECTION("Version mismatch")
    {
        std::string json = R"({
    "version": 1000,
    "entryStateName": "Start",
    "states": {
        "Start": {
            "transitions": [],
            "actionName": "advanceChar",
            "destinationTargetName": "Start"
        }
    }
})";

        auto&& result = loadModelFromString(json);
        REQUIRE_FALSE(result);
        REQUIRE(containsSubstr(
            result.error().what(), "Version 1000 is not supported"));
    }

    SECTION("Entry state name not defined")
    {
        std::string json = R"({
    "version": 1,
    "states": {
        "Start": {
            "transitions": [],
            "actionName": "advanceChar",
            "destinationTargetName": "Start"
        }
    }
})";

        auto&& result = loadModelFromString(json);
        REQUIRE_FALSE(result);
        REQUIRE(containsSubstr(
            result.error().what(), "Model does not contain entryStateName"));
    }

    SECTION("Entry state is empty")
    {
        std::string json = R"({
    "version": 1,
    "entryStateName": "",
    "states": {
        "Start": {
            "transitions": [],
            "actionName": "advanceChar",
            "destinationTargetName": "Start"
        }
    }
})";

        auto&& result = loadModelFromString(json);
        REQUIRE_FALSE(result);
        REQUIRE(
            containsSubstr(result.error().what(), "entryStateName is empty"));
    }

    SECTION("Entry state is missing")
    {
        std::string json = R"({
    "version": 1,
    "entryStateName": "End",
    "states": {
        "Start": {
            "transitions": [],
            "actionName": "advanceChar",
            "destinationTargetName": "Start"
        }
    }
})";

        auto&& result = loadModelFromString(json);
        REQUIRE_FALSE(result);
        REQUIRE(containsSubstr(
            result.error().what(), "states are missing the entry state"));
    }

    SECTION("States are missing")
    {
        std::string json = R"({
    "version": 1,
    "entryStateName": "Start"
})";

        auto&& result = loadModelFromString(json);
        REQUIRE_FALSE(result);
        REQUIRE(containsSubstr(
            result.error().what(), "Model does not contain states"));
    }

    SECTION("No states defined")
    {
        std::string json = R"({
    "version": 1,
    "entryStateName": "Start",
    "states": {}
})";

        auto&& result = loadModelFromString(json);
        REQUIRE_FALSE(result);
        REQUIRE(containsSubstr(result.error().what(), "states are empty"));
    }

    SECTION("Condition is missing")
    {
        std::string json = R"({
    "version": 1,
    "entryStateName": "Start",
    "states": {
        "Start": {
            "transitions": [
                {
                    "destinationTargetName": "Eof"
                }
            ],
            "actionName": "advanceChar",
            "destinationTargetName": "Start"
        }
    }
})";

        auto&& result = loadModelFromString(json);
        REQUIRE_FALSE(result);
        REQUIRE(containsSubstr(
            result.error().what(),
            "conditionName missing for transition of one of the states"));
    }

    SECTION("Condition is empty")
    {
        std::string json = R"({
    "version": 1,
    "entryStateName": "Start",
    "states": {
        "Start": {
            "transitions": [
                {
                    "conditionName": "",
                    "destinationTargetName": "Eof"
                }
            ],
            "actionName": "advanceChar",
            "destinationTargetName": "Start"
        }
    }
})";

        auto&& result = loadModelFromString(json);
        REQUIRE_FALSE(result);
        REQUIRE(containsSubstr(
            result.error().what(),
            "One of conditions of state Start has empty name"));
    }

    SECTION("Destination for conditional transition is missing")
    {
        std::string json = R"({
    "version": 1,
    "entryStateName": "Start",
    "states": {
        "Start": {
            "transitions": [
                {
                    "conditionName": "ABC"
                }
            ],
            "actionName": "advanceChar",
            "destinationTargetName": "Start"
        }
    }
})";

        auto&& result = loadModelFromString(json);
        REQUIRE_FALSE(result);
        REQUIRE(containsSubstr(
            result.error().what(),
            "destinationTargetName missing for transition of one of the "
            "states"));
    }

    SECTION("Destination for conditional transition is empty")
    {
        std::string json = R"({
    "version": 1,
    "entryStateName": "Start",
    "states": {
        "Start": {
            "transitions": [
                {
                    "conditionName": "ABC",
                    "destinationTargetName": ""
                }
            ],
            "actionName": "advanceChar",
            "destinationTargetName": "Start"
        }
    }
})";

        auto&& result = loadModelFromString(json);
        REQUIRE_FALSE(result);
        REQUIRE(containsSubstr(
            result.error().what(),
            "Condition ABC of state Start has empty destinationTargetName"));
    }

    SECTION("Action name is missing")
    {
        std::string json = R"({
    "version": 1,
    "entryStateName": "Start",
    "states": {
        "Start": {
            "transitions": [
                {
                    "conditionName": "ABC",
                    "destinationTargetName": "Start"
                }
            ],
            "destinationTargetName": "Start"
        }
    }
})";

        auto&& result = loadModelFromString(json);
        REQUIRE_FALSE(result);
        REQUIRE(containsSubstr(
            result.error().what(),
            "actionName is missing for one of the states"));
    }

    SECTION("Action name is empty")
    {
        std::string json = R"({
    "version": 1,
    "entryStateName": "Start",
    "states": {
        "Start": {
            "transitions": [
                {
                    "conditionName": "ABC",
                    "destinationTargetName": "Start"
                }
            ],
            "actionName": "",
            "destinationTargetName": "Start"
        }
    }
})";

        auto&& result = loadModelFromString(json);
        REQUIRE_FALSE(result);
        REQUIRE(containsSubstr(
            result.error().what(), "actionName of state Start is empty"));
    }

    SECTION("Destination for default transition is missing")
    {
        std::string json = R"({
    "version": 1,
    "entryStateName": "Start",
    "states": {
        "Start": {
            "transitions": [
                {
                    "conditionName": "ABC",
                    "destinationTargetName": "Start"
                }
            ],
            "actionName": "doNothing"
        }
    }
})";

        auto&& result = loadModelFromString(json);
        REQUIRE_FALSE(result);
        REQUIRE(containsSubstr(
            result.error().what(),
            "destinationTargetName is missing for one of the states"));
    }

    SECTION("Destination for default transition is empty")
    {
        std::string json = R"({
    "version": 1,
    "entryStateName": "Start",
    "states": {
        "Start": {
            "transitions": [
                {
                    "conditionName": "ABC",
                    "destinationTargetName": "Start"
                }
            ],
            "actionName": "doNothing",
            "destinationTargetName": ""
        }
    }
})";

        auto&& result = loadModelFromString(json);
        REQUIRE_FALSE(result);
        REQUIRE(containsSubstr(
            result.error().what(),
            "State Start has empty destinationTargetName"));
    }
}
