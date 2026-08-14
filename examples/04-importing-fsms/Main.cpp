/*
 * This example is the same as 02-simple-fsm, but this time
 * it demonstrates loading the machine from a JSON that can
 * be created with a designer, instead of building it in code.
 */

#include <CsvBlackboard.hpp>
#include <CsvFunctions.hpp>
#include <fsm/Factory.hpp>
#include <fsm/exports/JsonManifestExporter.hpp>
#include <fsm/imports/JsonModelImporter.hpp>
#include <iostream>
#include <print>
#include <string>

int main()
{
    auto doNothing = [](CsvBlackboard&) {};

    auto factory = fsm::Factory<CsvBlackboard>();

    // First, you need to register all supported methods with the factory
#define REGISTER_METHOD(x) #x, x

    factory.registerAction(REGISTER_METHOD(doNothing));
    factory.registerAction(REGISTER_METHOD(advanceChar));
    factory.registerAction(REGISTER_METHOD(handleSeparator));
    factory.registerAction(REGISTER_METHOD(handleNewline));
    factory.registerAction(REGISTER_METHOD(advanceChar));
    factory.registerCondition(REGISTER_METHOD(isEof));
    factory.registerCondition(REGISTER_METHOD(isSeparator));
    factory.registerCondition(REGISTER_METHOD(isNewline));

#undef REGISTER_METHOD

    // You can export the manifest with all supported methods
    // The manifest then gets loaded into the Designer
    auto&& exporter = fsm::JsonManifestExporter(std::cout);
    factory.exportManifest(exporter);

    // Then you can load a .json model of the FSM exported from the designer
    auto&& fsmJson = R"({
    "version": 1,
    "entryStateName": "Start",
    "states": {
        "Start": {
            "transitions": [
                {
                    "conditionName": "isEof",
                    "destinationTargetName": "__error__"
                },
                {
                    "conditionName": "isSeparator",
                    "destinationTargetName": "HandleSeparator"
                },
                {
                    "conditionName": "isNewline",
                    "destinationTargetName": "HandleNewline"
                }
            ],
            "actionName": "advanceChar",
            "destinationTargetName": "Start"
        },
        "HandleSeparator": {
            "actionName": "handleSeparator",
            "destinationTargetName": "Start"
        },
        "HandleNewline": {
            "actionName": "handleSeparator",
            "destinationTargetName": "HandleNewline2"
        },
        "HandleNewline2": {
            "actionName": "handleNewline",
            "destinationTargetName": "PostNewline"
        },
        "PostNewline": {
            "transitions": [
                {
                    "conditionName": "isEof",
                    "destinationTargetName": "__finish__"
                }
            ],
            "actionName": "doNothing",
            "destinationTargetName": "Start"
        }
    }
})";

    // Note that factory will fail if it wasn't initialized with register*
    // methods
    auto&& sstream = std::stringstream(fsmJson);
    auto&& importer = fsm::JsonModelImporter(sstream);
    auto&& result = factory.importFsm(importer);
    auto&& machine = std::move(result.value());

    std::println("");

    auto&& runMachine = [&machine](CsvBlackboard&& blackboard)
    {
        while (!machine.isErrored(blackboard)
               && !machine.isFinished(blackboard))
        {
            machine.tick(blackboard);
        }

        std::println(
            "Fsm\n  finished: {}\n  errored: {}\n",
            machine.isFinished(blackboard),
            machine.isErrored(blackboard));
    };

    // This one should succeed
    runMachine(CsvBlackboard {
        .data = "abc,bcd,cde\nabc,bcd,cde\n",
    });

    // This one should fail
    runMachine(CsvBlackboard {
        .data = "abc,bcd,cde\nabc,b",
    });
}
