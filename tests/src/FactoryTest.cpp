#include "catch_amalgamated.hpp"
#include "fsm/Factory.hpp"
#include "CsvParser.hpp"
#include "Blackboard.hpp"

#define REGISTER_METHOD(x) #x, x

/*
TEST_CASE("[Factory]")
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

    SECTION("Exports correct manifest.json")
    {
        // TODO: this should test another class
    }
}*/

#undef REGISTER_METHOD
