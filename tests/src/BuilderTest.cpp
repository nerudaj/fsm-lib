#include "Blackboard.hpp"
#include "CsvParser.hpp"
#include "catch_amalgamated.hpp"
#include <fsm/Builder.hpp>

TEST_CASE("[Builder]")
{
    SECTION("Cannot call __main__ machine from submachine")
    {
        // clang-format off
        REQUIRE_THROWS(fsm::Builder<Blackboard>()
            .withNoErrorMachine()
            .withSubmachine("A")
                .withEntryState("S")
                    .exec(nothing)
                        .andGoToMachine("__main__").thenGoToState("S")
                .done()
            .withMainMachine()
                .withEntryState("S")
                    .exec(nothing).andLoop()
                .done()
            .build());
        // clang-format on
    }

    SECTION("Cannot go to submachine not declared yet")
    {
        SECTION("From action")
        {
            // clang-format off
            REQUIRE_THROWS(fsm::Builder<Blackboard>()
                .withNoErrorMachine()
                .withSubmachine("A")
                    .withEntryState("S")
                        .exec(nothing)
                            .andGoToMachine("B"));
            // clang-format on
        }

        SECTION("From condition")
        {
            // clang-format off
            REQUIRE_THROWS(fsm::Builder<Blackboard>()
                .withNoErrorMachine()
                .withSubmachine("A")
                    .withEntryState("S")
                        .when(alwaysTrue).goToMachine("B"));
            // clang-format on
        }
    }

    SECTION(
        "Cannot call transition to current machine via submachine invocation")
    {
        SECTION("From action")
        {
            // clang-format off
            REQUIRE_THROWS(fsm::Builder<Blackboard>()
                .withNoErrorMachine()
                .withSubmachine("A")
                    .withEntryState("S")
                        .exec(nothing)
                            .andGoToMachine("A"));
            // clang-format on
        }

        SECTION("From condition")
        {
            // clang-format off
            REQUIRE_THROWS(fsm::Builder<Blackboard>()
                .withNoErrorMachine()
                .withSubmachine("A")
                    .withEntryState("S")
                        .when(alwaysTrue).goToMachine("A"));
            // clang-format on
        }
    }

    SECTION("Can call every single function")
    {
        // clang-format off
        std::ignore = fsm::Builder<Blackboard>()
            .withErrorMachine()
                .useGlobalEntryCondition(alwaysTrue)
                .withEntryState("A")
                    .when(alwaysTrue).goToState("B")
                    .orWhen(alwaysTrue).restart()
                    .otherwiseExec(nothing).andGoToState("B")
                .withState("B")
                    .exec(nothing).andLoop()
                .done()
            .withSubmachine("S")
                .withEntryState("A")
                    .when(alwaysTrue).error()
                    .orWhen(alwaysTrue).finish()
                    .orWhen(alwaysTrue).goToState("A")
                    .otherwiseExec(nothing).andFinish()
                .done()
            .withMainMachine()
                .withEntryState("A")
                    .when(alwaysTrue).goToMachine("S").thenGoToState("A")
                    .otherwiseExec(nothing).andGoToMachine("S").thenGoToState("A")
                .done()
            .build();
        // clang-format on
    }
}
