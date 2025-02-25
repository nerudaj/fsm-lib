cmake_minimum_required ( VERSION 3.26 )

include ( get_cpm.cmake )

set ( CMAKE_CXX_STANDARD 23 )

project ( test-cpm )

CPMAddPackage("gh:nerudaj/fsm-lib#${GIT_BRANCH}")

add_executable ( ${PROJECT_NAME} Main.cpp )

target_link_libraries ( ${PROJECT_NAME} fsm::fsm-lib )
