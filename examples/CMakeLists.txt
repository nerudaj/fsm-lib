set ( TARGET "examples-common" )

add_library ( ${TARGET} INTERFACE )
target_include_directories ( ${TARGET}
	INTERFACE "${CMAKE_CURRENT_SOURCE_DIR}/include"
)

target_link_libraries ( ${TARGET}
	INTERFACE fsm-lib
)

function ( execute_example_as_test TARGET_NAME )
	if ( FSM_BUILD_TESTS )
		add_test (
			NAME "${TARGET_NAME}"
			COMMAND "${TARGET_NAME}"
		)
	endif ()
endfunction ()

function ( fsm_lib_add_example TARGET_NAME )
	add_executable ( ${TARGET_NAME}
		"${CMAKE_CURRENT_SOURCE_DIR}/Main.cpp"
	)

	target_link_libraries ( ${TARGET_NAME} examples-common )

	apply_recommended_compile_options ( ${TARGET_NAME} )
	enable_autoformatter ( ${TARGET_NAME} )
	execute_example_as_test ( ${TARGET_NAME} )

	set_target_properties( ${TARGET_NAME} PROPERTIES FOLDER "examples" )
endfunction ()

add_subdirectory ( "${CMAKE_CURRENT_SOURCE_DIR}/01-loggable-blackboard" )
add_subdirectory ( "${CMAKE_CURRENT_SOURCE_DIR}/02-simple-fsm" )
add_subdirectory ( "${CMAKE_CURRENT_SOURCE_DIR}/03-exporting-diagrams" )
add_subdirectory ( "${CMAKE_CURRENT_SOURCE_DIR}/04-importing-fsms" )
