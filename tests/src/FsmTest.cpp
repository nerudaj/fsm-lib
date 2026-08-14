#include "Blackboard.hpp"
#include "CsvParser.hpp"
#include "catch_amalgamated.hpp"
#include <fsm/Builder.hpp>
#include <fsm/exports/MermaidExporter.hpp>
#include <fsm/logging/CsvLogger.hpp>

TEST_CASE("[FSM]")
{
    Blackboard bb;
    fsm::CsvLogger logger;

    SECTION("Machine can finish")
    {
        // clang-format off
        auto&& machine = fsm::Builder<Blackboard>()
            .withNoErrorMachine()
            .withMainMachine()
                .withEntryState("Start")
                    .exec(nothing).andFinish()
                .done()
            .build();
        // clang-format on

        REQUIRE_FALSE(machine.isFinished(bb));
        machine.tick(bb);
        REQUIRE(machine.isFinished(bb));
    }

    SECTION("Can restart machine from error state")
    {
        // clang-format off
        auto&& machine = fsm::Builder<Blackboard>()
            .withErrorMachine()
                .noGlobalEntryCondition()
                .withEntryState("Start")
                    .exec(nothing).andRestart()
                .done()
            .withMainMachine()
                .withEntryState("Start")
                    .when(alwaysTrue).error()
                    .otherwiseExec(nothing).andLoop()
                .done()
            .build();
        // clang-format on

        REQUIRE(bb.__stateIdxs.back() == 0); // "__main__:Start"
        machine.tick(bb);
        REQUIRE(bb.__stateIdxs.back() == 1); // "__error__:Start"
        REQUIRE(machine.isErrored(bb));
        machine.tick(bb);
        REQUIRE(bb.__stateIdxs.back() == 0); // "__main__:Start"
        REQUIRE(bb.__stateIdxs.size() == 1);
    }

    SECTION("Can enter and return from a submachine")
    {
        // clang-format off
        auto&& machine = fsm::Builder<Blackboard>()
            .withNoErrorMachine()
            .withSubmachine("Sub")
                .withEntryState("A")
                    .exec(nothing).andFinish()
                .done()
            .withMainMachine()
                .withEntryState("A")
                    .exec(nothing).andGoToMachine("Sub").thenGoToState("B")
                .withState("B")
                    .exec(nothing).andLoop()
                .done()
            .build();
        // clang-format on

        // Ordering:
        // 0: Sub:A
        // 1: __main__:A
        // 2: __main__:B

        REQUIRE(bb.__stateIdxs.back() == 0);
        REQUIRE(bb.__stateIdxs.size() == 1);
        machine.tick(bb);
        REQUIRE(bb.__stateIdxs.back() == 1);
        REQUIRE(bb.__stateIdxs.size() == 2);
        machine.tick(bb);
        REQUIRE(bb.__stateIdxs.back() == 2);
        REQUIRE(bb.__stateIdxs.size() == 1);
    }

    SECTION("Error from submachines clears state stack")
    {
        // clang-format off
        auto&& machine = fsm::Builder<Blackboard>()
            .withErrorMachine()
                .noGlobalEntryCondition()
                .withEntryState("A")
                   .exec(nothing).andLoop()
                .done()
            .withSubmachine("1")
                .withEntryState("A")
                    .when(alwaysTrue).error()
                    .otherwiseExec(nothing).andLoop()
                .done()
            .withSubmachine("2")
                .withEntryState("A")
                    .exec(nothing).andGoToMachine("1").thenGoToState("B")
                .withState("B")
                    .exec(nothing).andFinish()
                .done()
            .withMainMachine()
                .withEntryState("A")
                    .exec(nothing).andGoToMachine("2").thenGoToState("B")
                .withState("B")
                    .exec(nothing).andLoop()
                .done()
            .exportDiagram(fsm::MermaidExporter(std::cout))
            .build();
        // clang-format on

        machine.tick(bb); // going to 2
        REQUIRE(bb.__stateIdxs.size() == 2);
        machine.tick(bb); // going to 1
        REQUIRE(bb.__stateIdxs.size() == 3);
        machine.tick(bb); // going to error
        REQUIRE(bb.__stateIdxs.size() == 1);
    }

    SECTION(
        "Global error condition is taken into account when outside of error "
        "machine")
    {
        // clang-format off
        auto&& machine = fsm::Builder<Blackboard>()
            .withErrorMachine()
                .useGlobalEntryCondition(isExclamationMark)
                .withEntryState("A")
                    .exec(nothing).andGoToState("B")
                .withState("B")
                    .exec(nothing).andLoop()
                .done()
            .withSubmachine("HandleEscaped")
                .withEntryState("A")
                    .exec(advanceChar).andGoToState("MainLoop")
                .withState("MainLoop")
                    .when(isEscapeChar).finish()
                    .otherwiseExec(advanceChar).andLoop()
                .done()
            .withMainMachine()
                .withEntryState("A")
                    .when(isSeparatorChar).goToState("HandleSeparator")
                    .orWhen(isEscapeChar).goToMachine("HandleEscaped").thenGoToState("A")
                    .otherwiseExec(advanceChar).andLoop()
                .withState("HandleSeparator")
                    .exec([] (Blackboard& bb) { storeWord(bb); advanceChar(bb); }).andGoToState("PostSeparatorHandle")
                .withState("PostSeparatorHandle")
                    .exec(nothing).andGoToState("A")
                .done()
            .build();
        // clang-format on

        // All these cases are supposed to error out during 4th tick
        SECTION("Case A.I - Main machine")
        {
            bb.data = "abc!";
        }

        SECTION("Case A.II - Main machine, not entry state")
        {
            bb.data = "a,!";
        }

        SECTION("Case B - Sub machine")
        {
            bb.data = "\"a!";
        }

        machine.setLogger(logger);

        machine.tick(bb);
        machine.tick(bb);
        machine.tick(bb);

        REQUIRE(!machine.isErrored(bb));
        machine.tick(bb);
        REQUIRE(machine.isErrored(bb));
        REQUIRE(bb.__stateIdxs.back() == 1);
        machine.tick(bb);
        REQUIRE(machine.isErrored(bb));
        REQUIRE(bb.__stateIdxs.back() == 2);
    }

    SECTION("Can return from multiple submachines at once")
    {
        // clang-format off
        auto&& machine = fsm::Builder<Blackboard>()
            .withNoErrorMachine()
            .withSubmachine("3")
                .withEntryState("C")
                    .exec(nothing)
                        .andFinish()
                .done()
            .withSubmachine("2")
                .withEntryState("B")
                    .exec(nothing)
                        .andGoToMachine("3")
                            .thenFinish()
                .done()
            .withSubmachine("1")
                .withEntryState("A")
                    .exec(nothing)
                        .andGoToMachine("2")
                            .thenFinish()
                .done()
            .withMainMachine()
                .withEntryState("Start")
                    .exec(nothing)
                        .andGoToMachine("1")
                            .thenGoToState("End")
                .withState("End")
                    .exec(nothing).andLoop()
            .done()
        .build();
        // clang-format on

        machine.setLogger(logger);

        REQUIRE(bb.__stateIdxs.back() == 0u); // __main__:Start
        machine.tick(bb);
        REQUIRE(bb.__stateIdxs.back() == 1u); // 1:A
        machine.tick(bb);
        REQUIRE(bb.__stateIdxs.back() == 2u); // 2:B
        machine.tick(bb);
        REQUIRE(bb.__stateIdxs.back() == 3u); // 3:C
        machine.tick(bb);
        REQUIRE(bb.__stateIdxs.back() == 4u); // __main__:End
    }

    SECTION("FSM is movable")
    {
        // clang-format off
        auto&& machine = fsm::Builder<Blackboard>()
        .withNoErrorMachine()
        .withMainMachine()
            .withEntryState("Start")
                .exec(nothing).andFinish()
            .done()
        .build();
        // clang-format on

        SECTION("With default logger")
        {
            auto&& fsm = std::move(machine);

            REQUIRE_FALSE(fsm.isFinished(bb));
            fsm.tick(bb);
            REQUIRE(fsm.isFinished(bb));
        }

        SECTION("With custom logger")
        {
            auto&& customLogger = fsm::CsvLogger(std::cout);

            machine.setLogger(customLogger);
            auto&& fsm = std::move(machine);

            REQUIRE_FALSE(fsm.isFinished(bb));
            fsm.tick(bb);
            REQUIRE(fsm.isFinished(bb));
        }
    }
}
