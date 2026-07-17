#include "catch_amalgamated.hpp"
#include "fsm/imports/JsonModelImporter.hpp"

TEST_CASE("[JsonModelImporter]")
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
        auto&& sstream = std::stringstream(v1Json);
        auto&& importer = fsm::JsonModelImporter(sstream);
        auto&& result = importer.loadModel();
        REQUIRE(result);
        auto&& model = result.value();

        REQUIRE(model.version == 1);
        REQUIRE(model.entryStateName == "Start");
        REQUIRE(model.states.size() == 3u);

        REQUIRE(model.states["Start"].transitions.size() == 2u);
        REQUIRE(model.states["Start"].transitions[0].conditionName == "isEof");
        REQUIRE(model.states["Start"].transitions[0].destinationTargetName == "Eof");
        REQUIRE(model.states["Start"].transitions[1].conditionName == "isComma");
        REQUIRE(model.states["Start"].transitions[1].destinationTargetName == "Comma");
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
