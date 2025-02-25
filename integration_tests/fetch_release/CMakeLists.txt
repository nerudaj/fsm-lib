cmake_minimum_required ( VERSION 3.26 )

set ( CMAKE_CXX_STANDARD 23 )

# First, download and unpack the release using FetchContent
include ( FetchContent )

FetchContent_Declare ( LIBFSM
	URL "https://github.com/nerudaj/fsm-lib/releases/download/${LATEST_TAG}/fsm-lib-${LATEST_TAG}-Windows-MSVC-x64.zip"
	DOWNLOAD_EXTRACT_TIMESTAMP TRUE
)

FetchContent_MakeAvailable ( LIBFSM )

find_package ( fsm ${LATEST_TAG} REQUIRED PATHS "${libfsm_SOURCE_DIR}/lib/cmake" )

project ( test-cpm )

add_executable ( ${PROJECT_NAME} Main.cpp )

target_link_libraries ( ${PROJECT_NAME} fsm::fsm-lib )
