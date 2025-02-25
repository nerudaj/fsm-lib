cmake_minimum_required ( VERSION 3.26 )

set ( CMAKE_CXX_STANDARD 23 )

include ( FetchContent )

FetchContent_Declare ( LIBFSM_GIT
	GIT_REPOSITORY "https://github.com/nerudaj/fsm-lib"
	GIT_TAG "origin/${GIT_BRANCH}"
)

FetchContent_MakeAvailable ( LIBFSM_GIT )

project ( test-cpm )

add_executable ( ${PROJECT_NAME} Main.cpp )

target_link_libraries ( ${PROJECT_NAME} fsm::fsm-lib )
