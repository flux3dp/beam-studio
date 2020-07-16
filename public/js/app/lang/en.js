define(function() {
    'use strict';

    return {
        general: {
            wait: 'Processing, please wait'
        },
        buttons: {
            next: 'NEXT'
        },
        topbar: {
            untitled: 'Untitled',
            titles: {
                settings: 'Preferences'
            },
            zoom: 'Zoom',
            group: 'Group',
            ungroup: 'Ungroup',
            halign: 'HAlign',
            valign: 'VAlign',
            hdist: 'HDist',
            vdist: 'VDist',
            left_align: 'Left',
            center_align: 'Center',
            right_align: 'Right',
            top_align: 'Top',
            middle_align: 'Middle',
            bottom_align: 'Bottom',
            union: 'Union',
            subtract: 'Subtract',
            intersect: 'Intersect',
            difference: 'Difference',
            hflip: 'HFlip',
            vflip: 'VFlip',
            export: 'GO',
            preview: 'PREVIEW',
            borderless: '(BORDERLESS)',
            tag_names: {
                rect: 'Rectangle',
                ellipse: 'Oval',
                path: 'Path',
                polygon: 'Polygon',
                image: 'Image',
                text: 'Text',
                line: 'Line',
                g: 'Group',
                multi_select: 'Multi Select',
                use: 'Imported File',
                svg: 'Imported svg',
                dxf: 'Imported dxf',
            },
            alerts: {
                start_preview_timeout: 'Timeout has occured when starting preview mode. Please Restart your machine or Beam Studio. If this error persists, please follow <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/360001111355">this guide</a>.',
                fail_to_start_preview: 'Fail to start preview mode. Please Restart your machine or Beam Studio. If this error persists, please follow <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/360001111355">this guide</a>.',
            }
        },
        support: {
            no_webgl: 'WebGL is not supported. Please use other devices.',
            no_vcredist: 'Please install Visual C++ Redistributable 2015<br/>That can be downloaded on flux3dp.com',
            osx_10_9: 'OS X 10.9 is not supported. Please update to newer version'
        },
        generic_error: {
            UNKNOWN_ERROR: '[UE] Please restart FLUX Studio',
            OPERATION_ERROR: '[OE] A status conflict occured, please retry the action.',
            SUBSYSTEM_ERROR: '[SE] Please restart the machine',
            UNKNOWN_COMMAND: '[UC] Please update the Delta+/Delta Firmware',
            RESOURCE_BUSY: '[RB] Please restart  the machine, or try again'
        },
        device_selection: {
            no_printers: 'Cannot detect any machine through the Wi-Fi. Please check if your PC and machine are under the same network. <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/215394548">More Info</a>',
            no_beambox: 'Cannot detect any machine through the Wi-Fi. Please check if your PC and machine are under the same network. <a target="_blank" href="https://flux3dp.com/beambox-tutorial/">More Info</a>',
            module: 'MODULE',
            status: 'STATUS'
        },
        update: {
            release_note: 'Release Note:',
            firmware: {
                caption: 'A Firmware Update to the machine is available',
                message_pattern_1: '"%s" is now ready for firmware update.',
                message_pattern_2: '%s Firmware v%s is now available - You have v%s.',
                latest_firmware: {
                    caption: 'Machine firmware Update',
                    message: 'You have the latest Machine firmware',
                    still_update: 'UPDATE'
                },
                confirm: 'UPLOAD',
                upload_file: 'Firmware upload (*.bin / *.fxfw)',
                update_success: 'Firmware update successfully uploaded',
                update_fail: 'Update Fail'
            },
            software: {
                checking: 'Checking for Update',
                switch_version: 'Switch Version',
                check_update: 'Check for Update',
                caption: 'A Software Update to Beam Studio is available',
                downloading: 'Downloading updates in the background, you can click "OK" to continue your work.',
                install_or_not: 'is ready for update. Would you like restart and update now?',
                switch_or_not: 'is ready for switch. Would you like restart and switch now?',
                message_pattern_1: 'Beam Studio is now ready for software update.',
                message_pattern_2: 'FLUX Software v%s is now available - You have v%s.',
                available_update: 'Beam Studio v%s is available now. You have v%s. Do you want to download the update?',
                available_switch: 'Beam Studio v%s is available now. You have v%s. Do you want to switch to this version?',
                not_found: 'You are using the latest version Beam Studio.',
                no_response: 'Failed to connect to server, please check you network setting.',
                switch_version_not_found: 'Switchable Version not found.',
                yes: 'Yes',
                no: 'No',
                skip: 'Skip This Version'
            },
            toolhead: {
                caption: 'A Firmware Update to FLUX Toolhead is available',
                message_pattern_1: '"%s" is now ready for toolhead firmware update.',
                message_pattern_2: 'FLUX Toolhead Firmware %s is now available.',
                latest_firmware: {
                    caption: 'Toolhead Firmware Update',
                    message: 'You have the latest toolhead firmware'
                },
                confirm: 'UPLOAD',
                upload_file: 'Firmware upload (*.bin)',
                update_success: 'Toolhead Firmware update successfully uploaded',
                update_fail: 'Update Fail',
                waiting: 'Please connect the toolhead'
            },
            updating: 'Updating...',
            skip: 'Skip This Version',
            checkingHeadinfo: 'Checking Toolhead Information',
            preparing: 'Preparing...',
            later: 'LATER',
            download: 'ONLINE UPDATE',
            cannot_reach_internet: 'Server is unreachable<br/>Please checking internet connection',
            install: 'INSTALL',
            upload: 'UPLOAD'
        },
        topmenu: {
            version: 'Version',
            ok: 'OK',
            sure_to_quit: 'Are you sure you want to quit?',
            flux: {
                label: 'FLUX',
                about: 'About',
                preferences: 'Preferences',
                quit: 'Quit'
            },
            file: {
                label: 'File',
                import: 'Import',
                save_fcode: 'Export FLUX Task',
                save_scene: 'Save Scene',
                save_svg: 'Export SVG',
                save_png: 'Export PNG',
                save_jpg: 'Export JPG',
                converting: 'Converting to Image...',
                all_files: 'All Files',
                svg_files: 'SVG',
                png_files: 'PNG',
                jpg_files: 'JPG',
                bvg_files: 'Beambox Scene',
                fcode_files: 'FLUX Code',
                fsc_files: '3D Printing Scene',
                confirmReset: 'Are you sure you want to reset all settings?',
                clear_recent: 'Clear Recently Opened',
                path_not_exit: 'This path does not seem to exist anymore on disk.'
            },
            edit: {
                label: 'Edit',
                duplicate: 'Duplicate',
                rotate: 'Rotate',
                scale: 'Scale',
                clear: 'Clear Scene',
                undo: 'Undo',
                alignCenter: 'Align Center',
                reset: 'Reset'
            },
            device: {
                label: 'Machines',
                new: 'Machine Setup',
                device_monitor: 'Dashboard',
                device_info: 'Machine Info',
                head_info: 'Toolhead Info',
                change_filament: 'Change Printing Material',
                default_device: 'Set as Default',
                check_firmware_update: 'Update Firmware',
                update_delta: 'Machine Firmware',
                update_toolhead: 'Toolhead Firmware',
                calibrate: 'Run Auto Leveling',
                set_to_origin: 'Calibrate Origin ( Home )',
                movement_tests: 'Run Movement Tests',
                scan_laser_calibrate: 'Turn On Scanning Laser',
                clean_calibration: 'Run Auto Leveling with Clean Data',
                commands: 'Commands',
                set_to_origin_complete: 'The machine has calibrated its origin.',
                scan_laser_complete: 'The machine has turned on its scanning laser. Click "Finish" to turn it off.',
                movement_tests_complete: 'Movement tests completed',
                movement_tests_failed: 'Movement tests failed. <br/>1. Make sure the toolhead cable is stretched correctly.<br/>2. Make sure the connector of toolhead cable to the machine has inserted about half into the machine.<br/>3. Try to turn the connector on the printing toolhead 180 degrees.<br/>4. Check <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/115003674128">this article</a>.',
                download_log: 'Download Logs',
                download_log_canceled: 'Log download canceled',
                download_log_error: 'Unknown error occurred, please try it again later',
                log: {
                    network: 'Network',
                    hardware: 'Hardware',
                    discover: 'Discover',
                    usb: 'USB',
                    usblist: 'USB List',
                    camera: 'Camera',
                    cloud: 'Cloud',
                    player: 'Player',
                    robot: 'Robot'
                },
                finish: 'FINISH',
                cancel: 'CANCEL',
                turn_on_head_temperature: 'Set Toolhead Temperature',
                network_test: 'Test Network'
            },
            window: {
                label: 'Window',
                minimize: 'Minimize',
                fullscreen: 'Fullscreen'
            },
            help: {
                label: 'Help',
                help_center: 'Help Center',
                contact: 'Contact Us',
                tutorial: 'Start Printing Tutorial',
                software_update: 'Software Update',
                debug: 'Bug Report',
                forum: 'Community Forum'
            },
            account: {
                label: 'Account',
                sign_in: 'Sign In',
                sign_out: 'Sign Out'
            }
        },
        initialize: {
            // generic strings
            next: 'Next',
            start: 'START',
            skip: 'Skip',
            cancel: 'CANCEL',
            confirm: 'CONFIRM',
            connect: 'Connect',
            back: 'Back',
            retry: 'Retry',
            no_machine: 'I don\'t have a machine now.',

            // specific caption/content
            invalid_device_name: 'The name can only contains chinese, alphabet, numbers, blanks, and special characters  ( ) - _ ’ \'',
            require_device_name: 'Name is required',
            select_language: 'Select Language',
            change_password: {
                content: 'Are you sure to change the password?',
                caption: 'Changing password'
            },
            connect_flux: 'Connect the Machine',
            via_usb: 'Using USB Cable',
            via_wifi: 'Using Wi-Fi',
            select_machine_type: 'Select Your Model',
            select_connection_type: 'How do you wish to connect?',
            connection_types: {
                wifi: 'Wi-Fi',
                wired: 'Wired Network',
                ether_to_ether: 'Ethernet to Ethernet',
            },
            connect_wifi: {
                title: 'Connecting to Wi-Fi',
                tutorial1: '1. Go to Touch Panel > Click "Network" > "Connect to WiFi".',
                tutorial2: '2. Select and connect your prefered Wi-Fi.',
                what_if_1: 'What if I don\'t see my Wi-Fi?',
                what_if_1_content: '1. The Wi-Fi encryption mode should be WPA2 or no password.\n2. The encryption mode can be set in the Wi-Fi router administration interface. If the router doesn’t support WPA2 and you need help picking out the right router, please contact FLUX Support.',
                what_if_2: 'What if I don\'t see any Wi-Fi?',
                what_if_2_content: '1. Make sure the Wi-Fi dongle is fully plugged in.\n2. If there is no MAC Address of the wireless network on the touchscreen, please contact FLUX Support.\n3. The Wi-Fi channel should be 2.4Ghz (5Ghz is not supported).',
            },
            connect_wired: {
                title: 'Connecting to Wired Network',
                tutorial1: '1. Connect the machine with your router.',
                tutorial2: '2. Press "Network" to get the wired network IP.',
                what_if_1: 'What if the IP is empty?',
                what_if_1_content: '1. Make sure the Ethernet Cable is fully plugged in.\n2. If there is no MAC Address of the wired network on the touchscreen, please contact FLUX Support.',
                what_if_2: 'What if the IP starts with 169?',
                what_if_2_content: '1. If the IP address starts with 169.154, it should be a DHCP setting issue, please contact your ISP (internet service provider) for further assistance.\n2. If your computer connects to the internet directly using PPPoE, please change to using the router to connect using PPPoE, and enable DHCP feature in the router.'
            },
            connect_ethernet: {
                title: 'Ethernet To Ethernet',
                tutorial1: '1. Connect the machine with your computer with ethernet cable.',
                tutorial2_1: '2. Follow ',
                tutorial2_a_text: 'this guide',
                tutorial2_a_href_mac: 'https://support.flux3dp.com/hc/en-us/articles/360001517076',
                tutorial2_a_href_win: 'https://support.flux3dp.com/hc/en-us/articles/360001507715',
                tutorial2_2: ' to make your comuter as a router.',
                tutorial3: '3. Click Next.',
            },
            connect_machine_ip: {
                enter_ip: 'Enter Machine IP',
                check_ip: 'Checking IP availability',
                check_firmware: 'Checking firmware version',
                check_camera: 'Checking camera availability',
                retry: 'Retry',
                finish_setting: 'Finish Setting'
            },
            name_your_flux: 'Name Your Machine',
            wifi_setup: 'Wi-Fi Setup',
            select_preferred_wifi: 'Select your preferred network.',
            requires_wifi_password: 'requires a password.',
            connecting: 'Connecting...',

            set_connection: '%s Connection Setup',
            please_goto_touchpad: 'Please go to Beambox touchpad',
            tutorial: '1. On the Click touch panel of the machine, click "Network" > "WiFi Settings"\n2. Select your WiFi and enter the password.\n3. Wait 10 seconds, the Wireless IP Address would show at "Setting" > "Internet".\n4. If WiFi is unavailable, kindly connect with the ethernet port, with DHCP enabled routers.\n5. Enter Machine IP here  ',
            please_see_tutorial_video: 'Tutorial Video',
            tutorial_url: 'https://flux3dp.com/beambox-tutorial/',
            ip_wrong: 'IP Format is wrong. Please re-enter.',

            set_machine_generic: {
                printer_name: 'Name*',
                printer_name_placeholder: 'Give your machine an unique name',
                old_password: 'Current Password',
                password: 'Password',
                set_station_mode: 'Create a Network',
                password_placeholder: 'Secure your machine with password',
                incorrect_old_password: 'Incorrect Current Password',
                incorrect_password: 'Incorrect Password',
                ap_mode_name: 'Network Name',
                ap_mode_pass: 'Password',
                ap_mode_name_format: 'Only accept alphabets or numbers',
                ap_mode_pass_format: 'At least 8 characters',
                ap_mode_name_placeholder: 'Up to 32 characters.',
                ap_mode_pass_placeholder: 'Must have at least 8 characters.',
                create_network: 'Create Network',
                join_network: 'Join Other Network',
                security: 'Security'
            },

            setting_completed: {
                start: 'Start',
                is_ready: '“%s” is ready',
                station_ready_statement: 'Your machine is now a Wi-Fi station, you can use your machine wirelessly by connect to Wi-Fi “%s”',
                brilliant: 'Brilliant!',
                begin_journey: 'You can now detach USB / Micro USB Cable, and begin the journey of creativity.',
                great: 'Welcome to Beam Studio',
                setup_later: 'You can always set up your machine from Titlebar > "Machines" > "Machine Setup"',
                upload_via_usb: 'You can setup Wi-Fi connection later. <br/>If you don\'t have Wi-Fi, check <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/215998327-Connection-Guide-for-Desktop-PCs">Desktop Connection Guide</a>.',
                back: 'Back',
                ok: 'START CREATING'
            },

            notice_from_device: {
                headline: 'Check the Wi-Fi Indicator on your machine',
                subtitle: 'Please mind the status of Wi-Fi connection.',
                light_on: 'Light On',
                light_on_desc: 'The machine has connected to the Wi-Fi you assigned',
                breathing: 'Breathing',
                breathing_desc: 'Wi-Fi connection failed. Please try setting again.',
                successfully: 'If the machine connect successfully',
                successfully_statement: 'Please go back to your Wi-Fi list and connect your PC to %s, then restart FLUX Studio',
                restart: 'Restart FLUX Studio'
            },

            // errors
            errors: {
                error: 'Error',
                close: 'close',
                not_found: 'Not Found',
                not_support: 'Please update Machine Firmware to v1.6+, through USB',

                keep_connect: {
                    caption: 'USB Connection not found',
                    content: 'Oops! Don\'t worry. We\'re here for you.\nMake sure\n1. The Wi-Fi Indicator (green led) is flashing, breathing or being steady on.\n2. The driver is correctly installed. <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/215327328">(More Info)</a>\n3. Try replug it and wait for 10 sec.'
                },

                wifi_connection: {
                    caption: 'Unable to connect',
                    connecting_fail: 'Please make sure the Wi-Fi signal is strong and the password is correct.'
                },

                select_wifi: {
                    ap_mode_fail: 'Setup Failed.'
                }
            }
        },
        wifi: {
            home: {
                line1: 'Do you have available Wi-Fi could be able access?',
                line2: 'We are helping your FLUX to connecting to Wi-Fi',
                select: 'Yes'
            },
            set_password: {
                line1: 'Please Enter"',
                line2: '"Password of Wi-Fi Network.',
                password_placeholder: 'Enter Wi-Fi Password Here',
                back: 'Back',
                join: 'Join',
                connecting: 'Connecting'
            },
            success: {
                caption: 'Great! Connected Successfully!',
                line1: 'Now, We will set some simple setting for your machine.',
                next: 'Next'
            },
            failure: {
                caption: 'Failed to Connect.',
                line1: 'Please check your Wi-Fi work properly, and then reconnect.',
                next: 'Reconnect'
            },
            set_printer: {
                caption: 'Set name and password for your FLUX3D Printer.',
                printer_name: 'Name',
                printer_name_placeholder: 'Set name',
                password: 'Password',
                password_placeholder: 'Set password',
                notice: 'Set password, making only who knows the password can use FLUX Delta.',
                next: 'Next'
            }
        },
        menu: {
            print: 'PRINT',
            laser: 'ENGRAVE',
            scan: 'SCAN',
            usb: 'USB',
            device: 'Machine',
            setting: 'SETTING',
            draw: 'DRAW',
            cut: 'CUT',
            beambox: 'BEAMBOX',
            mill: 'MILL',
            mm: 'mm',
            inches: 'Inches'
        },
        settings: {
            on: 'On',
            off: 'Off',
            low: 'Low',
            high: 'Normal',
            caption: 'Settings',
            tabs: {
                general: 'General',
                device: 'Machine'
            },
            ip: 'Machine IP Address',
            guess_poke: 'Search for machine IP address',
            wrong_ip_format: 'Wrong IP Formats',
            lock_selection: 'Lock Selection',
            default_machine: 'Default Machine',
            default_machine_button: 'Empty',
            remove_default_machine_button: 'Remove',
            confirm_remove_default: 'Default machine is going to be removed.',
            reset: 'Reset Beam Studio',
            reset_now: 'Reset Beam Studio',
            confirm_reset: 'Confirm reset Beam Studio?',
            language: 'Language',
            notifications: 'Notifications',
            check_updates: 'Auto Check',
            updates_version: 'Versions',
            default_app: 'Default App',
            default_units: 'Default Units',
            default_font_family: 'Default Font',
            default_font_style: 'Default Font Style',
            fast_gradient: 'Fast Engraving',
            vector_speed_constraint: 'Constrain Export Speed',
            loop_compensation: 'Loop Compensation',
            blade_radius: 'Blade Radius',
            blade_precut_switch: 'Blade Precut',
            blade_precut_position: 'Precut Position',
            delta_series: 'Delta Family',
            beambox_series: 'Beambox Family',
            default_model: 'Default Model<br />(For Print Settings)',
            default_beambox_model: 'Default Document Setting',
            guides_origin: 'Guides Origin',
            guides: 'Guides',
            image_downsampling: 'Bitmap Quality',
            mask: 'Workarea Clipping',
            optimization: 'Optimization',
            font_substitute: 'Substitute Unsupported Characters',
            default_borderless_mode: 'Open Bottom Default',
            default_enable_autofocus_module: 'Autofocus Default',
            default_enable_diode_module: 'Hybrid Laser Default',
            diode_offset: 'Hybrid Laser Offset',
            none: 'None',
            close: 'Close',
            enabled: 'Enabled',
            disabled: 'Disabled',
            cancel: 'Cancel',
            done: 'Apply',
            groups: {
                general: 'General',
                update: 'Software Updates',
                connection: 'Connection',
                editor: 'Editor',
                engraving: 'Engraving',
                path: 'Path',
                mask: 'Workarea Clipping',
                text_to_path: 'Text to Path',
                modules: 'Add-on',
            },
            connect_printer: {
                title: 'Connect with your printer'
            },
            notification_on: 'On',
            notification_off: 'Off',
            update_latest: 'Latest',
            update_beta: 'Beta',
            engine_change_fail: {
                'caption': 'unable to change engine ',
                '1': 'error during checking',
                '2': 'cura version error',
                '3': 'path is not cura',
                '4': 'path is not a exist file, please check engine path in setting section'
            },
            allow_tracking: 'Would you like to send anonymous usage statistics to FLUX to improve the app?',
            flux_cloud: {
                processing: 'Processing...',
                flux_cloud: 'FLUX CLOUD',
                back: 'BACK',
                next: 'NEXT',
                done: 'DONE',
                sign_in: 'SIGN IN',
                sign_up: 'SIGN UP',
                success: 'SUCCESS',
                fail: 'FAIL',
                cancel: 'CANCEL',
                try_again: 'TRY AGAIN',
                bind: 'BIND',
                bind_another: 'BIND ANOTHER',
                username: 'Username',
                nickname: 'Nickname',
                email: 'Email',
                password: 'Password',
                re_enter_password: 'Re-Enter Password',
                forgot_password: 'Forgot your password?',
                sign_up_statement: 'If you don\'t have a FLUX ID, please <a href="%s">SIGN UP</a> here',
                try_sign_up_again: 'Please try <a href="%s">SIGN UP</a> again',
                agreement: 'Agree to the FLUX <a href="#/studio/cloud/privacy">Privacy</a>, <a href="#/studio/cloud/terms">Terms & Conditions</a>',
                pleaseSignIn: 'Please sign in with your FLUX ID',
                enter_email: 'Please fill in your email address',
                check_inbox: 'Go and check your mail box!',
                error_blank_username: 'Nickname can\'t be blank',
                error_blank_email: 'Email cannot be blank',
                error_email_format: 'Please provide a correct email',
                error_email_used: 'The email address has been used',
                error_password_not_match: 'Password does not match the confirm password.',
                select_to_bind: 'Select a machine to bind',
                binding_success: 'You have successfully bound your machine!',
                binding_success_description: 'You can now use FLUX app to check your machine status',
                binding_fail: 'Binding failed',
                binding_fail_description: 'May due to network error. Try it again',
                binding_error_description: 'Unable to turn on cloud feature of the machine. Please contact support with the error log',
                retrieve_error_log: 'Download error',
                binding: 'Binding...',
                check_email: 'Please check your email for instruction',
                email_exists: 'Email exists',
                not_verified: 'Email has not been verified',
                user_not_found: 'Incorrect Email or Password',
                resend_verification: 'Resend verification email',
                contact_us: 'Please contact FLUX support with your email and issue you encountered',
                confirm_reset_password: 'Reset your password?',
                format_error: 'Incorrect credentials',
                agree_to_terms: 'Please agree to terms',
                back_to_list: 'Back To List',
                change_password: 'Change password',
                current_password: 'Current Password',
                new_password: 'New Password',
                confirm_password: 'Confirm Password',
                empty_password_warning: 'Password cannot be empty',
                WRONG_OLD_PASSWORD: 'Incorrect Current Password',
                FORMAT_ERROR: 'Wrong password format',
                submit: 'SAVE',
                sign_out: 'Sign out',
                not_supported_firmware: 'Please upgrade your machine firmware\nto v1.5+ for cloud feature',
                unbind_device: 'Would you like to unbind this machine?',
                CLOUD_SESSION_CONNECTION_ERROR: 'The machine is unable to access to the cloud server. Please reboot the machine.',
                CLOUD_UNKNOWN_ERROR: 'The machine is unable to connected to the cloud server. Please reboot the machine.',
                SERVER_INTERNAL_ERROR: 'Server internal error, please try again later.',
            }
        },
        print: {
            import: 'IMPORT',
            save: 'Save',
            start_print: 'Print',
            gram: 'g',
            advanced: {
                general: 'General',
                layers: 'Layers',
                infill: 'Infill',
                support: 'Support',
                speed: 'Speed',
                custom: 'Text',
                slicingEngine: 'Slicing Engine',
                slic3r: 'Slic3r',
                cura: 'Cura',
                cura2: 'Cura2',
                filament: 'Filament',
                temperature: 'Material & Temperature',
                detect_filament_runout: 'Filament Detection',
                flux_calibration: 'Auto Calibration',
                detect_head_tilt: 'Tilt Detection',
                layer_height_title: 'Layer Height',
                layer_height: 'Layer Height',
                firstLayerHeight: 'First Layer Height',
                shell: 'Shell',
                shellSurface: 'Shell Surface',
                solidLayerTop: 'Solid Layer: Top',
                solidLayerBottom: 'Solid Layer: Bottom',
                density: 'Density',
                pattern: 'Pattern',
                auto: 'auto',                       // do not change
                line: 'Line',                       // do not change
                rectilinear: 'Rectilinear',         // do not change
                rectilinearGrid: 'Rectilinear Grid',// do not change
                honeycomb: 'Honeycomb',             // do not change
                offset: 'Offset',
                xyOffset: 'Horizontal Expansion',
                zOffset: 'Z Offset',
                cutBottom: 'Cut Bottom',
                curaInfill: {
                    automatic: 'Automatic',
                    grid: 'Grid',
                    lines: 'Lines',
                    concentric: 'Concentric',
                    concentric_3d: 'Concentric 3D',
                    cubic: 'Cubic',
                    cubicsubdiv: 'Cubic Subdivison',
                    tetrahedral: 'Tetrahedral',
                    triangles: 'Triangles',
                    zigzag: 'Zigzag'
                },
                curaSupport: {
                    lines: 'Lines',
                    grid: 'Grid',
                    zigzag: 'Zigzag'
                },
                blackMagic: 'Black Magic',
                spiral: 'Spiral',
                generalSupport: 'General Support',
                spacing: 'Line Distance',
                overhang: 'Overhang',
                zDistance: 'Z Distance',
                raft: 'Raft',
                raftLayers: 'Raft Layers',
                brim: 'Brim Width',
                skirts: 'Skirts',
                movement: 'Movement',
                structure: 'Structure',
                traveling: 'Traveling',
                surface: 'Surface',
                firstLayer: 'First Layer',
                solidLayers: 'Solid Layers',
                innerShell: 'Inner Shell',
                outerShell: 'Outer Shell',
                bridge: 'Bridge',
                config: 'Expert Settings',
                presets: 'Configs',
                name: 'Name',
                apply: 'APPLY',
                save: 'SAVE',
                saveAsPreset: 'Save Config',
                cancel: 'CANCEL',
                delete: 'DELETE',
                loadPreset: 'Load Config',
                savePreset: 'Save Config',
                reloadPreset: 'Reset Config',
                printing: 'Printing',
                firstLayerTemperature: 'First Layer',
                flexibleMaterial: 'Flexible Material'
            },
            mode: [
                {
                    value: 'beginner',
                    label: 'Beginner',
                    checked: true
                },
                {
                    value: 'expert',
                    label: 'Expert'
                }
            ],
            params: {
                beginner: {
                    print_speed: {
                        text: 'Print Speed',
                        options: [
                            {
                                value: 'slow',
                                label: 'Slow',
                                selected: true
                            },
                            {
                                value: 'fast',
                                label: 'Fast'
                            }
                        ]
                    },
                    material: {
                        text: 'Material',
                        options: [
                            {
                                value: 'pla',
                                label: 'PLA',
                                selected: true
                            }
                        ]
                    },
                    support: {
                        text: 'Support',
                        on: 'On',
                        off: 'Off',
                        options: [
                            {
                                value: 'Touching',
                                label: 'Touching',
                                checked: true
                            },
                            {
                                value: 'nowhere',
                                label: 'nowhere'
                            }
                        ]
                    },
                    platform: {
                        text: 'Platform',
                        options: [
                            {
                                value: 'raft',
                                label: 'Raft',
                                checked: true
                            }
                        ]
                    }
                },
                expert: {
                    layer_height: {
                        text: 'Layer Height',
                        value: 0.3,
                        unit: 'mm'
                    },
                    print_speed: {
                        text: 'Print Speed',
                        value: 50,
                        unit: 'mm/s'
                    },
                    temperature: {
                        text: 'Temperature',
                        value: 231,
                        unit: '°C'
                    },
                    support: {
                        text: 'Support',
                        options: [
                            {
                                value: 'everywhere',
                                label: 'Everywhere',
                                checked: true
                            },
                            {
                                value: 'nowhere',
                                label: 'nowhere'
                            }
                        ]
                    },
                    platform: {
                        text: 'Platform',
                        options: [
                            {
                                value: 'raft',
                                label: 'Raft',
                                checked: true
                            }
                        ]
                    }
                }
            },
            left_panel: {
                raft_on: 'RAFT ON',
                raft_off: 'RAFT OFF',
                support_on: 'SUPPORT ON',
                support_off: 'SUPPORT OFF',
                advanced: 'ADVANCED',
                preview: 'PREVIEW',
                plaTitle: 'PICK THE COLOR OF THE FILAMENT',
                transparent: 'TRANSPARENT',
                raftTitle: 'Raft are layers built under your parts and help them stick to the base plate',
                supportTitle: 'Support are generated structures to supportt overhanging parts of your object, in order to prevent filament dropping',
                advancedTitle: 'Detail 3d printing parameters, you may acheive better result than default by adjusting them',
                confirmExitFcodeMode: 'Exiting preview mode will unload the FCode, are you sure?'
            },
            right_panel: {
                get: 'Get',
                go: 'Go',
                preview: 'Preview'
            },
            quality: {
                high: 'HIGH QUALITY',
                med: 'MEDIUM QUALITY',
                low: 'LOW QUALITY',
                custom: 'CUSTOM QUALITY'
            },
            model: {
                fd1: 'DELTA',
                fd1p: 'DELTA+'
            },
            scale: 'SCALE',
            rotate: 'ROTATE',
            delete: 'Delete',
            reset: 'Reset',
            cancel: 'CANCEL',
            done: 'DONE',
            pause: 'PAUSE',
            restart: 'RESTART',
            download_prompt: 'please enter file name',
            importTitle: 'Import 3D models ( .stl )',
            getFcodeTitle: 'Save toolhead path and config into FCode file ( *.fc )',
            goTitle: 'Prepare to print',
            deviceTitle: 'Show machine monitor',
            rendering: 'Slicing',
            reRendering: 'Re-Slicing',
            finishingUp: 'Finishing up...',
            savingFilePreview: 'Saving file preview',
            uploading: 'Uploading to slicing engine',
            uploaded: 'Uploaded, slicing engine is processing...',
            importingModel: 'Importing Model',
            wait: 'Please wait...',
            out_of_range: 'Out of range',
            out_of_range_message: 'please reduce the size of the object(s)',
            drawingPreview: 'Drawing preview path, please wait',
            gettingSlicingReport: 'Getting slicing status'
        },
        draw: {
            pen_up: 'Moving Height',
            pen_down: 'Drawing Height',
            speed: 'Speed',
            pen_up_title: 'The height that your pen won\'t contact drawing surface',
            pen_down_title: 'The height that your pen will contact drawing surface, must be lower than moving height',
            speed_title: 'The drawing speed',
            units: {
                mms: 'mm/s',
                mm: 'mm'
            }
        },
        cut: {
            horizontal_calibrate: 'Horizontal\nAdjustment',
            height_calibrate: 'Height\nAdjustment',
            running_horizontal_adjustment: 'Running Horizontal Adjustment..',
            running_height_adjustment: 'Running Height Adjustment...',
            run_height_adjustment: 'Please adjust the blade, and run the height adjustment',
            horizontal_adjustment_completed: 'Horizontal Adjustment Completed',
            height_adjustment_completed: 'Height Adjustment Completed',
            you_can_now_cut: 'Congrats! You can now start cutting sheets.',
            zOffset: 'Height Offset',
            overcut: 'Overcut',
            speed: 'Speed',
            bladeRadius: 'Blade Radius',
            backlash: 'Backlash Compensation',
            zOffsetTip: 'Adjust the cutting height for thicker vinyl or to prevent cutting too hard or too light',
            overcutTip: 'Overcut loops for peeling off easier',
            speedTip: 'The cutting speed',
            backlashTip: 'Adjust the value if straight lines are not straight enough when using third party blade.',
            units: {
                mms: 'mm/s',
                mm: 'mm'
            }
        },
        mill: {
            calibrate: 'Auto\nLevel',
            zOffset: 'Cutting Height',
            overcut: 'Overcut',
            speed: 'Speed',
            repeat: 'Repeat',
            stepHeight: 'Step Height',
            backlash: 'Backlash Compensation',
            zOffsetTip: 'Adjust cutting height for thicker vinyl and to prevent cutting too hard or too light',
            overcutTip: 'Overcut loops for peeling off easier',
            speedTip: 'The cutting speed',
            backlashTip: 'Adjust the value if straight lines is not straight enough',
            units: {
                mms: 'mm/s',
                mm: 'mm'
            }
        },
        laser: {
            import: 'IMPORT',
            save: 'Save',
            custom: 'Custom',
            presets: 'Load Config',
            button_advanced: 'ADVANCED',
            confirm: 'Confirm',
            get_fcode: 'Save<br/>Task',
            export_fcode: 'Save as File ...',
            name: 'Name',
            go: 'GO',
            showOutline: 'View\nFrame',
            do_calibrate: 'It seems you\'re using engraving for the first time, you can use the kraft card in the package to find the best focal length. Do you wish to load the calibration image? You can also load it later in "Advanced".',
            process_caption: 'Generating',
            laser_accepted_images: 'Supported formats: BMP/GIF/JPG/PNG/SVG',
            draw_accepted_images: 'Supported formats: SVG',
            svg_fail_messages: {
                'TEXT_TAG': 'SVG Tag &lt;text&gt; is not supported',
                'DEFS_TAG': 'SVG Tag &lt;defs&gt; is not supported',
                'CLIP_TAG': 'SVG Tag &lt;clip&gt; is not supported',
                'FILTER_TAG': 'SVG Tag &lt;filter&gt; is not supported',
                'EMPTY': 'is an empty file',
                'FAIL_PARSING': 'failed on parsing process',
                'SVG_BROKEN': 'was broken',
                'NOT_SUPPORT': 'This file is not SVG'
            },
            title: {
                material: 'Select a proper material to have the best engraving result.',
                object_height: 'Object height measured from the base plate to the max height of the object',
                height_offset: 'Adjust z position for best laser focusing',
                shading: 'Shading enables the gradient effect of laser engraving. It takes longer time.',
                advanced: 'Custom settings for power and speed.'
            },
            print_params: {
                object_height: {
                    text: 'OBJECT HEIGHT',
                    unit: 'mm'
                },
                height_offset: {
                    text: 'FOCUS OFFSET',
                    unit: 'mm'
                },
                shading: {
                    text: 'SHADING',
                    textOn: 'ON',
                    textOff: 'OFF',
                    checked: true
                }
            },
            object_params: {
                position: {
                    text: 'POSITION'
                },
                size: {
                    text: 'SIZE',
                    unit: {
                        width: 'W',
                        height: 'H'
                    }
                },
                rotate: {
                    text: 'ROTATE'
                },
                threshold: {
                    text: 'THRESHOLD',
                    default: 128
                }
            },
            advanced: {
                label: 'Setup',
                form: {
                    object_options: {
                        text: 'MATERIAL',
                        label: 'Object Options',
                        options: [
                            {
                                value: 'cardboard',
                                label: 'Kraftpaper',
                                data: {
                                    laser_speed: 10,
                                    power: 255
                                }
                            },
                            {
                                value: 'wood',
                                label: 'WOOD',
                                data: {
                                    laser_speed: 3,
                                    power: 255
                                }
                            },
                            {
                                value: 'leather',
                                label: 'LEATHER',
                                data: {
                                    laser_speed: 5,
                                    power: 255
                                }
                            },
                            {
                                value: 'paper',
                                label: 'PAPER',
                                data: {
                                    laser_speed: 2,
                                    power: 255
                                }
                            },
                            {
                                value: 'cork',
                                label: 'CORK',
                                data: {
                                    laser_speed: 5,
                                    power: 255
                                }
                            },
                            {
                                value: 'other',
                                label: 'OTHER',
                                data: {}
                            }
                        ]
                    },
                    laser_speed: {
                        text: 'Laser Speed',
                        unit: 'mm/s',
                        fast: 'Fast',
                        slow: 'Slow',
                        min: 0.8,
                        max: 20,
                        step: 0.1
                    },
                    power: {
                        text: 'Power',
                        high: 'High',
                        low: 'Low',
                        min: 0,
                        max: 255,
                        step: 1
                    }
                },
                save_and_apply: 'SAVE & APPLY',
                save_as_preset: 'SAVE',
                save_as_preset_title: 'Save Config',
                load_preset_title: 'Load Config',
                background: 'Background',
                removeBackground: ' Remove Background',
                removePreset: 'selected preset is going to be revomved',
                load_calibrate_image: 'Load Calibration Image',
                apply: 'APPLY',
                cancel: 'CANCEL',
                save: 'SAVE'
            }
        },
        scan: {
            stop_scan: 'Stop',
            over_quota: 'Over quota',
            convert_to_stl: 'Convert',
            scan_again: 'Scan Again',
            start_multiscan: 'Extra Scan',
            processing: 'Processing...',
            remaining_time: 'Left',
            do_save: 'Save STL',
            go: 'Go',
            rollback: 'Back',
            error: 'Error',
            confirm: 'Confirm',
            caution: 'Caution',
            cancel: 'Cancel',
            delete_mesh: 'Delete?',
            quality: 'QUALITY',
            scan_again_confirm: 'Do you wish to discard current scan result?',
            calibrate: 'Calibrate',
            calibration_done: {
                caption: 'Calibration Done',
                message: 'You are able to scan now'
            },
            cant_undo: 'Unable to undo',
            estimating: 'Estimating the time...',
            calibrate_fail: 'Calibration Failed',
            calibration_is_running: 'Calibrating for Scanning',
            calibration_firmware_requirement: 'Please upgrade your firmware to 1.6.9+',
            resolution: [{
                id: 'best',
                text: 'Best',
                time: '~30min',
                value: 1200
            },
            {
                id: 'high',
                text: 'High',
                time: '~20min',
                value: 800
            },
            {
                id: 'normal',
                text: 'Normal',
                time: '~10min',
                value: 400
            },
            {
                id: 'low',
                text: 'Low',
                time: '~5min',
                value: 200
            },
            {
                id: 'draft',
                text: 'Draft',
                time: '~2min',
                value: 100
            }],
            save_mode: [
                {
                    value: 'stl',
                    label: 'STL',
                    checked: true
                },
                {
                    value: 'pcd',
                    label: 'PCD'
                },
            ],
            manipulation: {
                filter: 'FILTER',
                position: 'POSITION',
                size: 'SIZE',
                rotate: 'ROTATE',
                crop: 'Crop',
                manual_merge: 'Merge',
                clear_noise: 'Denoise',
                save_pointcloud: 'Export'
            },
            size: {
                x: 'X',
                y: 'Y',
                z: 'Z'
            },
            rotate: {
                x: 'X',
                y: 'Y',
                z: 'Z'
            },
            translate: {
                x: 'X',
                y: 'Y',
                z: 'Z'
            },
            messages: {
                'not open': {
                    caption: 'Camera not detected / Too dark',
                    message: 'Please pull off the scanning camera, until it makes a sound at the end.'
                },
                'no object': {
                    caption: 'Calibration tool not detected',
                    message: 'Insert the calibration tool into the center slot, and make sure there is sufficient lighting.'
                },
                'no laser': {
                    caption: 'Scanning laser not detected',
                    message: 'Press the laser heads to open it, and make sure the lighting is not to much.'
                }
            }
        },
        beambox: {
            tag:{
                g: 'Group',
                use: 'Import Svg',
                image: 'Image',
                text: 'Text'
            },
            toolbox: {
                ALIGN_LEFT: 'Align Left',
                ALIGN_RIGHT: 'Align Right',
                ALIGN_TOP: 'Align Top',
                ALIGN_BOTTOM: 'Align Bottom',
                ALIGN_CENTER: 'Align Center',
                ALIGN_MIDDLE: 'Align Middle',
                ARRANGE_HORIZON: 'Arrange Horizontally',
                ARRANGE_VERTICAL: 'Arrange Vertically',
                ARRANGE_DIAGONAL: 'Arrange Diagonally'
            },
            popup: {
                select_favor_input_device: 'Better user experience has been optimized<br/>Please select your favorite input device.',
                select_import_method: 'Select layering style:',
                touchpad: 'TouchPad',
                mouse: 'Mouse',
                layer_by_layer: 'Layer',
                layer_by_color: 'Color',
                nolayer: 'Single Layer',
                loading_image: 'Loading image, please wait...',
                no_support_text: 'Beam Studio does not support text tag currently. Please transfer text to path before importing.',
                power_too_high_damage_laser_tube: 'Using lower laser power will extends laser tube\'s lifetime.' ,
                speed_too_high_lower_the_quality: 'Using too high speed at this resolution may result in the lower quality of shading engraving.',
                both_power_and_speed_too_high: 'Using lower laser power will extends laser tube\'s lifetime.\nAlso, too high speed at this resolution may result in the lower quality of shading engraving.',
                too_fast_for_path: 'Using too high speed in layers containing path objects may result in lower precision when cutting.\nWe don\'t recommend using speed faster than 20mm/s when cutting.',
                too_fast_for_path_and_constrain: 'Following layers: %s\ncontain vector path objects, and have speed exceeding 20mm/s.\nThe cutting speed of vector path objects will be contrained to 20mm/s.\nYou can remove this limit at Preferens Settings.',
                should_update_firmware_to_continue: 'Your firmware does not support this version of Beam Studio. Kindly update firmware to continue. (Menu > Machine > [Your Machine] > Update Firmware)',
                more_than_two_object: 'Too many objects. Only support for 2 objects',
                not_support_object_type: 'Not support object type',
                select_first: 'Select an object first.',
                select_at_least_two: 'Select two objects to proceed',
                import_file_contain_invalid_path: 'Imported SVG file contains invalid image path. Please make sure all image files exist or embed image in the file',
                import_file_error_ask_for_upload: 'Failed to Imported SVG file. Are you willing to provide file to develop team for bug report ?',
                upload_file_too_large: 'File is too large for upload.',
                successfully_uploaded: 'File upload successed.',
                upload_failed: 'File upload failed.',
                or_turn_off_borderless_mode: ' Or turn off Open Bottom mode.',
                svg_1_1_waring: 'The version of this SVG file is v 1.1, there might be potential incompatibility problems.',
                svg_image_path_waring: 'This SVG file contains <image> loading from file path. This might cause fails when loading.\nTo avoid this risk, Please kindly use embed image when exporting SVG.',
                dxf_version_waring: 'The version of this Dxf file is not 2013, there might be potential incompatibility problems.',
                dont_show_again: 'Don\'t Show this next time.',
                convert_to_path_fail: 'Failed to convert to path.',
                save_unsave_changed: 'Do you want to save unsaved changes?',
                dxf_bounding_box_size_over: 'Drawing size is out of workarea. Please move your drawing closer to origin in your CAD softwate, or make sure that the unit is set correctly.',
                progress: {
                    uploading: 'Uploading'
                },
                backend_connect_failed_ask_to_upload: 'Errors keeps occuring when trying to connect to the backend. Do you want to upload your bug report log?',
                pdf2svg: {
                    error_when_converting_pdf: 'Error when converting pdf to svg:',
                    error_pdf2svg_not_found: 'Error: Command pdf2svg not found. Please install pdf2svg with your package manager (e.g., "yum install pdf2svg" or "apt-get install pdf2svg").',
                },
                ungroup_use: 'This will ungroup imported dxf or svg. Because the file may contain a great amount of elements, it may take time to ungroup. Are you sure to proceed?',
            },
            zoom_block: {
                fit_to_window: 'Fit to Window',
            },
            left_panel: {
                insert_object: 'Insert Object',
                preview: 'Preview',
                borderless: '(Borderless)',
                advanced: 'Advanced',
                image_trace: 'Trace Image',
                suggest_calibrate_camera_first: 'Please calibrate the camera. (Menu > Machine > [Your Machine] > Calibrate Camera)\nRefocus platform properly everytime using it to perform better preview result.',
                end_preview: 'End Preview Mode',
                unpreviewable_area: 'Blind Area',
                diode_blind_area: 'Hybrid Laser Add-On Blind Area',
                borderless_blind_area: 'Non-engraving Area',
                borderless_preview: 'Borderless Mode Camera Preview',
                rectangle: 'Rectangle',
                ellipse: 'Ellipse',
                line: 'Line',
                image: 'Image',
                text: 'Text',
                label: {
                    cursor: 'Select',
                    photo: 'Image',
                    text: 'Text',
                    line: 'Line',
                    rect: 'Rectangle',
                    oval: 'Oval',
                    polygon: 'Polygon',
                    pen: 'Pen',
                    array: 'Array',
                    preview: 'Camera Preview',
                    trace: 'Trace Image',
                    clear_preview: 'Clear Preview'
                },
                insert_object_submenu: {
                    rectangle: 'Rectangle',
                    ellipse: 'Ellipse',
                    line: 'Line',
                    image: 'Image',
                    text: 'Text',
                    path: 'Path',
                    polygon: 'Polygon'
                },
            },
            right_panel: {
                tabs: {
                    layers: 'Layers',
                    objects: 'Objects',
                },
                layer_panel: {
                    layer1: 'Layer 1',
                    layer_bitmap: 'Bitmap',
                    layer_engraving: 'Engraving',
                    layer_cutting: 'Cutting',
                    move_elems_to: 'Move elements to:',
                    notification: {
                        dupeLayerName: 'There is already a layer named that!',
                        newName: 'NEW NAME',
                        enterUniqueLayerName: 'Please enter a unique layer name',
                        enterNewLayerName: 'Please enter the new layer name',
                        layerHasThatName: 'Layer already has that name',
                        QmoveElemsToLayer: 'Move selected elements to layer \'%s\'?',
                    },
                    layers: {
                        layer: 'Layer',
                        layers: 'Layers',
                        del: 'Delete Layer',
                        move_down: 'Move Layer Down',
                        new: 'New Layer',
                        rename: 'Rename Layer',
                        move_up: 'Move Layer Up',
                        dupe: 'Duplicate Layer',
                        lock: 'Lock Layer',
                        merge_down: 'Merge Down',
                        merge_all: 'Merge All',
                        move_elems_to: 'Move elements to:',
                        move_selected: 'Move selected elements to a different layer'
                    },
                },
                laser_panel: {
                    parameters: 'Parameters',
                    strength: 'Power',
                    speed: 'Speed',
                    repeat: 'Execute',
                    focus_adjustment: 'Focus Adjustment',
                    height: 'Object Height',
                    z_step: 'Z Step',
                    diode: 'Diode Laser',
                    times: 'times',
                    cut: 'Cut',
                    engrave: 'Engrave',
                    more: 'Manage',
                    delete: 'Delete',
                    reset: 'Reset',
                    sure_to_reset: 'This will reset all presets and keep your customized parameters, are you sure to proceed?',
                    apply: 'Apply',
                    cancel: 'Cancel',
                    save: 'Save',
                    name: 'Name',
                    default: 'Default',
                    customized: 'Customized list',
                    inuse: 'Using',
                    export_config: 'Export Parameters',
                    sure_to_load_config: 'This will load arrangement of presets and replacing customized parameters set in the file, are you sure to proceed?',
                    dropdown: {
                        mm: {
                            wood_3mm_cutting: 'Wood - 3mm Cutting',
                            wood_5mm_cutting: 'Wood - 5mm Cutting',
                            wood_bw_engraving: 'Wood - Monochromic Engraving',
                            wood_shading_engraving: 'Wood - Shading Engraving',
                            acrylic_3mm_cutting: 'Acrylic - 3mm Cutting',
                            acrylic_5mm_cutting: 'Acrylic - 5mm Cutting',
                            acrylic_bw_engraving: 'Acrylic - Monochromic Engraving',
                            acrylic_shading_engraving: 'Acrylic - Shading Engraving',
                            leather_3mm_cutting: 'Leather - 3mm Cutting',
                            leather_5mm_cutting: 'Leather - 5mm Cutting',
                            leather_bw_engraving: 'Leather - Monochromic Engraving',
                            leather_shading_engraving: 'Leather - Shading Engraving',
                            fabric_3mm_cutting: 'Fabric - 3mm Cutting',
                            fabric_5mm_cutting: 'Fabric - 5mm Cutting',
                            fabric_bw_engraving: 'Fabric - Monochromic Engraving',
                            fabric_shading_engraving: 'Fabric - Shading Engraving',
                            rubber_bw_engraving: 'Rubber - Monochromic Engraving',
                            glass_bw_engraving:  'Glass - Monochromic Engraving',
                            metal_bw_engraving: 'Metal - Monochromic Engraving',
                            stainless_steel_bw_engraving_diode: 'Metal - Monochromic Engraving (Diode Laser)',
                            save: 'Save',
                            export: 'Export',
                            more: 'Manage',
                            parameters: 'Presets'
                        },
                        inches: {
                            wood_3mm_cutting: 'Wood - 0.1\'\' Cutting',
                            wood_5mm_cutting: 'Wood - 0.2\'\' Cutting',
                            wood_bw_engraving: 'Wood - Monochromic Engraving',
                            wood_shading_engraving: 'Wood - Shading Engraving',
                            acrylic_3mm_cutting: 'Acrylic - 0.1\'\' Cutting',
                            acrylic_5mm_cutting: 'Acrylic - 0.2\'\' Cutting',
                            acrylic_bw_engraving: 'Acrylic - Monochromic Engraving',
                            acrylic_shading_engraving: 'Acrylic - Shading Engraving',
                            leather_3mm_cutting: 'Leather - 0.1\'\' Cutting',
                            leather_5mm_cutting: 'Leather - 0.2\'\' Cutting',
                            leather_bw_engraving: 'Leather - Monochromic Engraving',
                            leather_shading_engraving: 'Leather - Shading Engraving',
                            fabric_3mm_cutting: 'Fabric - 0.1\'\' Cutting',
                            fabric_5mm_cutting: 'Fabric - 0.2\'\'Cutting',
                            fabric_bw_engraving: 'Fabric - Monochromic Engraving',
                            fabric_shading_engraving: 'Fabric - Shading Engraving',
                            rubber_bw_engraving: 'Rubber - Monochromic Engraving',
                            glass_bw_engraving:  'Glass - Monochromic Engraving',
                            metal_bw_engraving: 'Metal - Monochromic Engraving',
                            stainless_steel_bw_engraving_diode: 'Metal - Monochromic Engraving (Diode Laser)',
                            save: 'Save',
                            export: 'Export',
                            more: 'Manage',
                            parameters: 'Presets'
                        },
                    },
                    laser_speed: {
                        text: 'Laser Speed',
                        unit: 'mm/s',
                        fast: 'Fast',
                        slow: 'Slow',
                        min: 3,
                        max: 300,
                        step: 0.1
                    },
                    power: {
                        text: 'Power',
                        high: 'High',
                        low: 'Low',
                        min: 1,
                        max: 100,
                        step: 0.1
                    },
                    para_in_use: 'This parameter is being used.',
                    do_not_adjust_default_para: 'Default parameter can not be adjusted.',
                    existing_name: 'This parameter name has been used.'
                },
                object_panel: {
                    zoom: 'Zoom',
                    group: 'Group',
                    ungroup: 'Ungroup',
                    hdist: 'Horizontal Distribute',
                    vdist: 'Vertical Distribute',
                    left_align: 'Left Align',
                    center_align: 'Center Align',
                    right_align: 'Right Align',
                    top_align: 'Top Align',
                    middle_align: 'Middle Align',
                    bottom_align: 'Bottom Align',
                    union: 'Union',
                    subtract: 'Subtract',
                    intersect: 'Intersect',
                    difference: 'Difference',
                    hflip: 'Horizontal Flip',
                    vflip: 'Vertical Flip',
                    option_panel: {
                        fill: 'Infill',
                        rounded_corner: 'Rounded corner',
                        font_family: 'Font',
                        font_style: 'Style',
                        font_size: 'Size',
                        letter_spacing: 'Letter spacing',
                        line_spacing: 'Line spacing',
                        vertical_text: 'Vertical text',
                        shading: 'Gradient',
                        threshold: 'Threshold brightness',
                    },
                    actions_panel: {
                        replace_with: 'Replace With...',
                        trace: 'Trace',
                        grading: 'Grading',
                        sharpen: 'Sharpen',
                        crop: 'Crop',
                        bevel: 'Bevel',
                        invert: 'Invert',
                        convert_to_path: 'Convert to Path',
                        wait_for_parsing_font: 'Parsing font... Please wait a second',
                        offset: 'Offset',
                        array: 'Array',
                        decompose_path: 'Decompose',
                        disassemble_use: 'Disassemble',
                    }
                },
            },
            bottom_right_panel: {
                convert_text_to_path_before_export: 'Convert Text to Path...',
                retreive_image_data: 'Retrieve Image Data...',
                export_file_error_ask_for_upload: 'Failed to export task. Are you willing to provide working scene to develop team for bug report?',
            },
            image_trace_panel: {
                apply: 'Apply',
                back: 'Back',
                cancel: 'Cancel',
                next: 'Next',
                brightness: 'Brightness',
                contrast: 'Contrast',
                threshold: 'Threshold',
                okay: 'Okay',
                tuning: 'Parameters'
            },
            photo_edit_panel: {
                apply: 'Apply',
                back: 'Back',
                cancel: 'Cancel',
                next: 'Next',
                sharpen: 'Sharpen',
                sharpness: 'Sharpness',
                crop: 'Crop',
                curve: 'Curve',
                start: 'Start',
                processing: 'Processing',
                invert: 'Invert Color',
                okay: 'Okay',
                phote_edit: 'Photo Edit'
            },
            document_panel: {
                document_settings: 'Document Settings',
                engrave_parameters: 'Engraving Parameters',
                workarea: 'Work Area',
                rotary_mode: 'Rotary',
                borderless_mode: 'Open Bottom',
                engrave_dpi: 'Resolution',
                enable_diode: 'Hybrid Laser',
                enable_autofocus: 'Autofocus',
                add_on: 'Add-ons',
                low: 'Low',
                medium: 'Medium',
                high: 'High',
                ultra: 'Ultra High',
                enable: 'Enable',
                disable: 'Disable',
                cancel: 'Cancel',
                save: 'Save'
            },
            object_panels: {
                position: 'Position',
                rotation: 'Rotation',
                size: 'Size',
                width: 'Width',
                height: 'Height',
                center: 'Center',
                ellipse_radius: 'Size',
                rounded_corner: 'Rounded Corner',
                radius: 'Radius',
                points: 'Points',
                length: 'Length',
                text: 'Text',
                font_size: 'Size',
                fill: 'Infill',
                letter_spacing: 'Letter Spacing',
                line_spacing: 'Line Spacing',
                vertical_text: 'Vertical Text',
                convert_to_path: 'Convert to Path',
                convert_to_path_to_get_precise_result: 'Some fonts can\'t be parsed correctly. Please convert text to path before submitting to Beambox',
                wait_for_parsing_font: 'Parsing font... Please wait a second',
                text_to_path: {
                    font_substitute_pop: 'Text: "%s" contains below characters which are not supported by current font: "%s".\n%s\nWould you like to use "%s" as substitution?',
                    check_thumbnail_warning: 'Some texts were changed to other Fonts when parsing texts to paths and some character may not converted normally.\nPlease check preview image again before sending task.'
                },
                laser_config: 'Laser Config',
                shading: 'Shading',
                threshold: 'Threshold',
                lock_desc: 'Preserve the ratio of width and height (SHIFT)'
            },
            tool_panels:{
                cancel: 'Cancel',
                confirm: 'Confirm',
                grid_array: 'Create Grid Array',
                array_dimension: 'Array Dimension',
                rows: 'Rows',
                columns: 'Cols.',
                array_interval: 'Array Interval',
                dx: 'X',
                dy: 'Y',
                offset: 'Offset',
                nest: 'Arrangement Optimization',
                _offset: {
                    direction: 'Offset Direction',
                    inward: 'Inward',
                    outward: 'Outward',
                    dist: 'Offset Distance',
                    corner_type: 'Corner',
                    sharp: 'Sharp',
                    round: 'Round',
                    fail_message: 'Failed to Offset Objects.',
                    not_support_message: 'Selected elements containing unsupported SVG tag：\n&lt;image&gt;, &lt;g&gt;, &lt;text&gt;, &lt;use&gt;\nThese objects will be skipped.',
                },
                _nest: {
                    start_nest: 'Arrange',
                    stop_nest: 'Stop',
                    end: 'Close',
                    spacing: 'Spacing',
                    rotations: 'Possible Rotation',
                    no_element: 'There is no element to arrange.',
                }
            },
            network_testing_panel: {
                network_testing: 'Network Testing',
                local_ip: 'Local IP address:',
                insert_ip: 'Target device IP address:',
                empty_ip: 'Please enter target device IP first.',
                start: 'Start',
                end: 'End',
                testing: 'Testing Network...',
                invalid_ip: 'Invalid IP address',
                network_healthiness: 'Network Healthiness',
                average_response: 'Average Response Time',
                test_completed: 'Test Completed',
                test_fail: 'Test Failed',
                cannot_connect_1: 'Fail to connect to target IP.',
                cannot_connect_2: 'Fail to connect to target IP. Please make sure that the target is in the same network.',
                cannot_get_local: 'Access to local IP address failed.',
                fail_to_start_network_test: 'Fail to start network testing.'
            },
            layer_color_config_panel: {
                layer_color_config: 'Layer Color Configurations',
                color: 'Color',
                power: 'Power',
                speed: 'Speed',
                repeat: 'Execute',
                add: 'Add',
                save: 'Save',
                cancel: 'Cancel',
                default: 'Reset To Default',
                add_config: 'Add Color',
                in_use: 'This color is in use.',
                no_input: 'Please input valid hex color code.',
                sure_to_reset: 'You will lose all customized parameters, are you sure to reset to default ?',
                sure_to_delete: 'Are you sure to delete this color setting ?'
            },
            svg_editor: {
                unnsupported_file_type: 'The file type is not directly supported. Please convert the file into SVG or bitmap',
                unnsupport_ai_file_directly: 'Please convert your AI file into SVG or Bitmap first.',
                unable_to_fetch_clipboard_img: 'Failed to fetch image from your clipboard',
            },
            units: {
                walt: 'W',
                mm: 'mm'
            }
        },
        select_printer: {
            choose_printer: 'Choose a machine',
            notification: '"%s" requires a password',
            submit: 'SUBMIT',
            please_enter_password: 'Password',
            auth_failure: 'Authentication fail',
            retry: 'Retry',
            unable_to_connect: '#008 Unable to build a stable connection with machine'
        },
        device: {
            pause: 'Pause',
            paused: 'Paused',
            pausing: 'Pausing',
            select_printer: 'Select Printer',
            retry: 'Retry',
            status: 'Status',
            busy: 'Busy',
            ready: 'Ready',
            reset: 'Reset (Kick)',
            abort: 'Abort',
            start: 'Start',
            please_wait: 'Please Wait...',
            quit: 'Quit',
            heating: 'Heating',
            completing: 'Completing',
            aborted: 'Aborted',
            completed: 'Completed',
            calibrating: 'Calibrating',
            showOutline: 'frame showing',
            aborting: 'Aborting',
            starting: 'Starting',
            preparing: 'Preparing',
            resuming: 'Resuming',
            scanning: 'Scanning',
            occupied: 'Mantaining',
            running: 'Working',
            uploading: 'Uploading',
            processing: 'Processing',
            disconnectedError: {
                caption: 'Machine disconnected',
                message: 'Please confirm if network access of %s is available'
            },
            noTask: 'There are currently no task to do',
            pleaseWait: 'Please Wait...',
            finishing: 'Finishing',
            initiating: 'Initiating',
            unknown: 'Unknown',
            pausedFromError: 'Paused from error',
            model_name: 'Model Name',
            IP: 'IP',
            serial_number: 'Serial Number',
            firmware_version: 'Firmware Version',
            UUID: 'UUID',
            select: 'Select',
            deviceList: 'Machine List',
            calibration: {
                title: 'Auto Calibration',
                A: 'Leveling & Height',
                H: 'Height Only',
                N: 'Off',
                byFile: 'By File'
            },
            detectFilament: {
                title: 'Filament Detection',
                on: 'On',
                off: 'Off',
                byFile: 'By File'
            },
            filterHeadError: {
                title: 'Toolhead Error Detection',
                shake: 'Shake',
                tilt: 'Tilt',
                fan_failure: 'Fan Failure',
                laser_down: 'Laser Interlock',
                byFile: 'By File',
                no: 'No'
            },
            autoresume: {
                title: 'Smart Task Continuation',
                on: 'On',
                off: 'Off'
            },
            broadcast: {
                title: 'UPNP Broadcast',
                L: 'Default',
                A: 'Active',
                N: 'No'
            },
            enableCloud: {
                title: 'Enable Cloud',
                A: 'Active',
                N: 'No'
            },
            backlash: 'Geometric Error Correction',
            turn_on_head_temperature: 'Set Toolhead Temperature',
            plus_camera: 'Upgrade Kits Camera',
            plus_extrusion: 'Upgrade Kits Extruder',
            postback_url: 'Status callback URL',
            movement_test: 'Movement Test Before Print',
            machine_radius: 'Delta Radius',
            disable: 'Disable',
            enable: 'Enable',
            beambox_should_use_touch_panel_to_adjust: 'Beambox settings should be adjusted from Beambox touch panel.'
        },
        monitor: {
            change_filament                     : 'CHANGE FILAMENT',
            browse_file                         : 'BROWSE FILE',
            monitor                             : 'MONITOR',
            currentTemperature                  : 'Current Temp',
            nothingToPrint                      : 'There is nothing to print',
            go                                  : 'Start',
            start                               : 'Start',
            pause                               : 'Pause',
            stop                                : 'Stop',
            record                              : 'Record',
            camera                              : 'Camera',
            connecting                          : 'Connecting, please wait...',
            HEAD_OFFLINE                        : '#110 Toolhead not detected\nMake sure the toolhead cable is attached correctly <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218183157">More Info</a>',
            HEAD_ERROR_CALIBRATING              : '#112 Unable to calibrate toolhead\'s internal gyro\nPlease re-attach the toolhead',
            HEAD_ERROR_FAN_FAILURE              : '#113 Cooling fan failed\nKindly spin the fan with a pencil or thin stick. <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/217732178">More Info</a>',
            HEAD_ERROR_HEAD_OFFLINE             : '#110 Toolhead not detected\nMake sure the toolhead cable is attached correctly <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218183157">More Info</a>',
            HEAD_ERROR_TYPE_ERROR               : '#111 Toolhead incorrect \nPlease attach the correct toolhead',
            HEAD_ERROR_INTLK_TRIG               : '#116 Engraving toolhead tilt detected \nPlease ensure the rods are connected correctly. <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/217085937">More Info</a>',
            HEAD_ERROR_RESET                    : '#114 Toolhead bad connection\nMake sure the toolhead is connected correctly, kindly contact support if this error pops out twice in one print <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218183167">More Info</a>',
            HEAD_ERROR_TILT                     : '#162 Toolhead tilt detected\nPlease check ball joint rod is attached correctly',
            HEAD_ERROR_SHAKE                    : '#162 Toolhead tilt detected\nPlease check ball joint rod is attached correctly',
            HEAD_ERROR_HARDWARE_FAILURE         : '#164 Toolhead abnormal temperature detected\nPlease contact FLUX Support <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218415378">More Info</a>',
            'HEAD_ERROR_?'                      : '#199 Toolhead error \nCheck if the toolhead is abnormal',
            HARDWARE_ERROR_FILAMENT_RUNOUT      : '#121 Filament not detected \nPlease insert new material <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218931757">More Info</a>',
            HARDWARE_ERROR_0                    : '#121 Filament not detected \nPlease insert new material <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218931757">More Info</a>',
            HARDWARE_ERROR_PLATE_MISSING        : '#122 Unable to detect the base plate\nPlease put on the plate.',
            HARDWARE_ERROR_ZPROBE_ERROR         : '#123 Unable to calibrate the base plate\nPlease remove potential obstacles (left-over on the nozzle or the plate ) <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218931767">More Info</a>',
            HARDWARE_ERROR_CONVERGENCE_FAILED   : '#123 Unable to calibrate the base plate\nPlease remove potential obstacles (left-over on the nozzle or the plate ) <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218931767">More Info</a>',
            HARDWARE_ERROR_HOME_FAILED          : '#124 Unable to calibrate origin (home)\nPlease remove obstacles on rails, and make sure toolhead cables are not caught by carriages.',
            HARDWARE_ERROR_MAINBOARD_ERROR      : '#401 Critical Error: Mainboard offline. Please contact FLUX Support.',
            HARDWARE_ERROR_SUBSYSTEM_ERROR      : '#402 Critical Error: Subsystem no response. Please contact FLUX Support.',
            HARDWARE_ERROR_SENSOR_ERROR         : 'Hardware sensor error, please contact FLUX Support.~',
            HARDWARE_ERROR_SENSOR_ERROR_FSR     : 'Pressure sensor failed',
            HARDWARE_ERROR_PUMP_ERROR           : '#900 Please check with your water tank.',
            HARDWARE_ERROR_DOOR_OPENED          : '#901 Close the door to continue.',
            HARDWARE_ERROR_OVER_TEMPERATURE     : '#902 Overheated. Please wait for a few minutes.',
            USER_OPERATION_ROTARY_PAUSE         : 'Please switch to the rotary motor',
            WRONG_HEAD                          : 'Toolhead is unknown, please connect to a correct toolhead',
            USER_OPERATION                      : 'Machine is being operated by (other) user',
            RESOURCE_BUSY                       : 'The machine is busy\nIf it is not running, please restart the machine',
            DEVICE_ERROR                        : 'Something went wrong\nPlease restart the machine',
            NO_RESPONSE                         : 'Something went wrong\nPlease restart the machine',
            SUBSYSTEM_ERROR                     : '#402 Critical Error: Subsystem no response. Please contact FLUX Support.',
            HARDWARE_FAILURE                    : 'Something went wrong\nPlease restart the machine',
            MAINBOARD_OFFLINE                   : 'Something went wrong\nPlease restart the machine',
            G28_FAILED                          : '#124 Unable to calibrate origin (home)\nPlease remove obstacles on rails, and make sure toolhead cables are not caught by carriages.',
            FILAMENT_RUNOUT_0                   : '#121 Ran out of filament\nPlease insert new material <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218931757">More Info</a>',
            USER_OPERATION_FROM_CODE            : 'Paused for operation (filament change)',
            processing                          : 'Processing',
            savingPreview                       : 'Generating thumbnails',
            hour                                : 'h',
            minute                              : 'm',
            second                              : 's',
            left                                : 'left',
            temperature                         : 'Temperature',
            forceStop                           : 'Do you wish to abort current task?',
            upload                              : 'Upload',
            download                            : 'Download',
            relocate                            : 'Relocate',
            cancel                              : 'Cancel',
            prepareRelocate                     : 'Preparing for Relocate',
            fileNotDownloadable                 : 'This file type is not supported for download',
            cannotPreview                       : 'Can not preview this file format',
            extensionNotSupported               : 'This file format is not supported',
            fileExistContinue                   : 'File already exists, do you want to replace it?',
            confirmGToF                         : 'The GCode will be converted to FCode, do you want to continue? ( will replace if exists )',
            updatePrintPresetSetting            : 'FLUX Studio has new default printing parameters, do you want to update?\n( Current settings will be overwritten )',
            confirmFileDelete                   : 'Are you sure you want to delete this file?',
            task: {
                EXTRUDER                        : 'Printing',
                PRINT                           : 'Printing',
                LASER                           : 'Laser Engraving',
                DRAW                            : 'Digital Drawing',
                CUT                             : 'Vinyl Cutting',
                VINYL                           : 'Vinyl Cutting',
                BEAMBOX                         : 'Laser Engraving',
                'N/A'                           : 'Free Mode'
            },
            device: {
                EXTRUDER                        : 'Printing Toolhead',
                LASER                           : 'Engraving Toolhead',
                DRAW                            : 'Drawing Toolhead'
            },
            cant_get_toolhead_version           : 'Unable to get toolhead information'
        },
        alert: {
            caption: 'Error',
            duplicated_preset_name: 'Duplicated preset name',
            info: 'INFO',
            warning: 'WARNING',
            error: 'UH-OH',
            retry: 'Retry',
            abort: 'Abort',
            confirm: 'Confirm',
            cancel: 'Cancel',
            close: 'Close',
            ok: 'OK',
            ok2: 'OK',
            yes: 'Yes',
            no: 'No',
            stop: 'Stop',
            save: 'Save',
            dont_save: 'Don\'t Save'
        },
        caption: {
            connectionTimeout: 'Connection timeout'
        },
        message: {
            connecting: 'Connecting...',
            connectingMachine: 'Connecting %s...',
            tryingToConenctMachine: 'Trying to connect to machine...',
            connected: 'Connected',
            authenticating: 'Authenticating...',
            runningTests: 'Running tests...',
            machineNotConnected: 'Machine is not connected',
            notPrinting: 'Printing is not in progress',
            nothingToPrint: 'Nothing to print (source blob missing)',
            connectionTimeout: 'Please check your network state and your machine\'s Wi-Fi indicator.',
            device_not_found: {
                caption: 'Default Machine not found',
                message: 'Please check your machine\'s Wi-Fi indicator'
            },
            device_busy: {
                caption: 'Machine Busy',
                message: 'The machine is executing another task, try again later. If it stops working, please restart the machine.'
            },
            device_is_used: 'The machine is being used, do you want to abort current task?',
            device_in_use: 'The machine is being used, please stop or pause current task.',
            invalidFile: 'The file is not a valid STL file',
            failGeneratingPreview: 'Fail to generate preview',
            slicingFailed: 'slic3r is unable to slice this model',
            no_password: {
                content: 'Setup machine password via USB to enable connection for this computer',
                caption: 'Password not set'
            },
            image_is_too_small: 'The file contains unsupported information',
            monitor_too_old: {
                caption: 'Firmware Outdated',
                content: 'Please install the latest firmware with <a target="_blank" href="http://helpcenter.flux3dp.com/hc/en-us/articles/216251077">this guide</a>.'
            },
            cant_establish_connection: 'Unable to connect FLUX Studio API. Please <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/requests/new" target="_blank">contact FLUX support.</a>',
            application_occurs_error: 'The application has encountered an unhandled error.',
            error_log: 'Error Log',
            fcodeForLaser: 'This is a FCode for engraving',
            fcodeForPen: 'This is a FCode for drawing',
            confirmFCodeImport: 'Importing FCode will remove all objects on the scene, are you sure?',
            confirmSceneImport: 'Importing .fsc will remove all objects on the scene, are you sure?',
            brokenFcode: 'Unable to open %s',
            slicingFatalError: 'Error encountered during slicing. Kindly report STL file to customer support.',
            unknown_error: 'The application has encountered an unknown error, please use Help > Menu > Bug Report.',
            unknown_device: 'Cannot connect to the machine, please make sure USB is attached to the machine',
            important_update: {
                caption: 'Important Update',
                message: 'Important Machine firmware update is available. Do you wish to update now?',
            },
            unsupport_osx_version: 'Unsupported Mac OS X Version Detected',
            need_password: 'Need Password to Connect to the Machine',
            unavailableWorkarea: 'Current workarea exceeds the workarea of this machine. Please check the workarea of selected machine or set workarea from Edit > Document Setting.',
            new_app_downloading: 'FLUX Studio is Downloading',
            new_app_download_canceled: 'FLUX Studio download has been canceled',
            new_app_downloaded: 'Newest FLUX Studio has been downloaded',
            ask_for_upgrade: 'Do you wish to upgrade now?',
            please_enter_dpi: 'Please enter the Unit of your file',
            reset_sd_card: 'Please reset machine\'s SD card',
            gcode_area_too_big: 'Imported GCode exceed the printable area.',
            empty_file: 'File is empty',
            usb_unplugged: 'USB connection is lost. Please check your USB connection',
            launghing_from_installer_warning: 'You are launching FLUX Studio from the installer, and this may cause problems. Please move the FLUX Studio to the Application folder.',
            uploading_fcode: 'Uploading FCode',
            cant_connect_to_device: 'Unable to connect the machine, please check your connection',
            unable_to_find_machine: 'Unable to find machine ',
            unable_to_start: 'Unable to start the task. Please try again. If this happens again, please contact us with bug report:\n',
            camera_fail_to_transmit_image: 'Something went wrong with image transmission. Please try restarting your Beambox or contact us.'
        },
        machine_status: {
            '-10': 'Maintain mode',
            '-2': 'Scanning',
            '-1': 'Maintaining',
            0: 'Idle',
            1: 'Initiating',
            2: 'ST_TRANSFORM',
            4: 'Starting',
            6: 'Resuming',
            16: 'Working',
            18: 'Resuming',
            32: 'Paused',
            36: 'Paused',
            38: 'Pausing',
            48: 'Paused',
            50: 'Pausing',
            64: 'Completed',
            66: 'Completing',
            128: 'Aborted',
            UNKNOWN: 'Unknown'
        },
        head_module: {
            EXTRUDER: 'Print',
            LASER: 'Laser',
            UNKNOWN: '',
            error: {
                'missing': 'Error information is missing',
                '0': 'Unknown module',
                '1': 'Sensor communication failure',
                '2': 'No hello', // pi will send head_error_reset before this is issued
                '3': '#112 Unable to calibrate toolhead\'s internal gyro\nPlease re-attach the toolhead',
                '4': '#162 Toolhead tilt detected\nPlease check ball joint rod is attached correctly',
                '5': '#162 Toolhead tilt detected\nPlease check ball joint rod is attached correctly',
                '6': '#119 Printer toolhead is unable to control temperature. Please contact FLUX Support.',
                '7': '#113 Cooling fan failed\nKindly spin the fan with a pencil or thin stick. <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/217732178">More Info</a>',
                '8': '#116 Engraving toolhead tilt detected\nPlease ensure the rods are connected correctly. <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/217085937">More Info</a>',
                '9': '#118 Unable to heat printer toolhead\nPlease contact FLUX Support.'
            }
        },
        change_filament: {
            home_caption: 'Change Filament',
            load_filament_caption: 'LOAD',
            load_flexible_filament_caption: 'LOAD FLEXIBLE',
            unload_filament_caption: 'UNLOAD',
            cancel: 'CANCEL',
            load_filament: 'Load Filament',
            load_flexible_filament: 'Load Flexible Filament',
            unload_filament: 'Unload Filament',
            next: 'NEXT',
            heating_nozzle: 'Heating nozzle',
            unloading: 'Unloading Filament',
            loaded: 'Filament Loaded',
            unloaded: 'Filament Unloaded',
            ok: 'OK',
            kicked: 'Has been kicked',
            auto_emerging: 'Please insert filament',
            loading_filament: 'Loading filament',
            maintain_head_type_error: 'Toolhead not installed correctly',
            disconnected: 'Connection unstable, Please check device connection and try again later',
            maintain_zombie: 'Please restart the machine',
            toolhead_no_response: '#117 Module no response <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218347477">More</a>',
            NA: 'Toolhead is not connected'
        },
        head_temperature: {
            title: 'Set toolhead temperature',
            done: 'FINISH',
            target_temperature: 'Target temperature',
            current_temperature: 'Current temperature',
            set: 'set',
            incorrect_toolhead: 'Incorrect toolhead, please use printing toolhead',
            attach_toolhead: 'Please connect the printing toolhead'
        },
        camera_calibration: {
            update_firmware_msg1: 'Your firmware does not support this function. Please update firmware to v',
            update_firmware_msg2: 'or above to continue。 (Menu > Machine > [Your Machine] > Update Firmware)',
            camera_calibration: 'Camera Calibration',
            next: 'NEXT',
            cancel: 'CANCEL',
            back: 'BACK',
            finish: 'DONE',
            please_goto_beambox_first: 'Please switch to Engraving Mode ( Beambox ) in order to use this feature.',
            please_place_paper: {
                beambox: 'Please place an A4 or Letter size white paper at left-top corner of workarea',
                beamo: 'Please place an A4 or Letter size white paper at left-top corner of workarea',
            },
            please_refocus: {
                beambox: 'Kindly adjust the platform to the focal point (the height of turned down acrylic)',
                beamo: 'Kindly adjust the laser head to focus on the engraving object (the height of turned down acrylic)'
            },
            dx: 'X',
            dy: 'Y',
            rotation_angle: 'Rotation',
            x_ratio: 'X Ratio',
            y_ratio: 'Y Ratio',
            show_last_config: 'Show Last Result',
            hide_last_config: 'Hide Last Result',
            taking_picture: 'Taking Picture...',
            start_engrave: 'START ENGRAVE',
            analyze_result_fail: 'Fail to analyze captured image.<br/>Please make sure:<br/>1. Captured picture fully coverd with white paper.<br/>2. The platform is focus properly.',
            no_lines_detected: 'Fail to detect lines from captured image.<br/>Please make sure:<br/>1. Captured picture fully coverd with white paper.<br/>2. The platform is focus properly.',
            drawing_calibration_image: 'Drawing calibration image...',
            please_confirm_image: '<div><div class="img-center" style="background:url(%s)"></div></div>Please make sure:<br/>1. Captured picture fully coverd with white paper.<br/>2. The platform is focus properly.',
            calibrate_done: 'Calibration done. Better camera accurency is given when focus precisely.',
            hint_red_square: 'Please align the red square with cut square',
            hint_adjust_parameters: 'Use these parameters to adjust the red square'
        },
        diode_calibration: {
            update_firmware_msg1: 'Your firmware does not support this function. Please update firmware to v',
            update_firmware_msg2: 'or above to continue。 (Menu > Machine > [Your Machine] > Update Firmware)',
            diode_calibration: 'Hybrid Laser Module Calibration',
            next: 'NEXT',
            cancel: 'CANCEL',
            back: 'BACK',
            start_engrave: 'START ENGRAVE',
            finish: 'DONE',
            please_do_camera_calibration_and_focus: {
                beambox: 'When calibrating hybrid laser module, camera is needed.\nPlease make sure camera of this machine has been calibrated.\nAnd kindly adjust the platform to the focal point (the height of turned down acrylic)',
                beamo: 'When calibrating hybrid laser module, camera is needed.\nPlease make sure camera of this machine has been calibrated.\nAnd kindly adjust the laser head to focus on the engraving object (the height of turned down acrylic)'
            },
            please_place_paper: {
                beambox: 'Please place an A4 or Letter size white paper at left-top corner of workarea',
                beamo: 'Please place an A4 or Letter size white paper at left-top corner of workarea',
            },
            dx: 'X',
            dy: 'Y',
            drawing_calibration_image: 'Drawing calibration image...',
            taking_picture: 'Taking Picture...',
            calibrate_done: 'Calibration done. Offset of diode module has been saved.',
            hint_red_square: 'Please align the red square with cut square',
            hint_adjust_parameters: 'Use these parameters to adjust the red square'
        },
        input_machine_password: {
            require_password: '"%s" requires a password',
            connect: 'CONNECT',
            password: 'Password'
        },
        set_default: {
            success: 'Successfully set %s as default',
            error: 'Unable to set %s as default, due to network issue'
        },
        tutorial: {
            set_first_default_caption: 'Welcome',
            set_first_default: 'Do you wish to set "%s" as your default device?',
            startWithFilament: 'Now we\'re going to load the filament',
            startWithModel: 'Next, let\'s import an example 3D model',
            startTour: 'Welcome!<br/>This is your first time printing,<br/>would you like to start printing tutorial?',
            clickToImport: 'Click here to import an example 3D model',
            selectQuality: 'Select the quality you preferred',
            clickGo: 'Prepare to print',
            startPrint: 'Apply glue on the plate with no-grid, wait till it\' dry, then you are ready to print.',
            skip: 'Skip',
            startPrintDeltaPlus: 'Make sure you put on the magnetic print plate.',
            runningMovementTests: 'Running movement tests',
            connectingMachine: 'Connecting to the machine',
            movementTestFailed: { caption: 'Unable to pass movement tests',  message: '1. Make sure the toolhead cable is stretched correctly.<br/>2. Make sure the connector of toolhead cable to the machine has inserted about half into the machine.<br/>3. Try to turn the connector on the printing toolhead 180 degrees.<br/>4. Check <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/115003674128">this article</a>.<br/> Try again?' },
            befaultTutorialWelcome: 'Thank you for ordering FLUX Delta+!<br/><br/> This guide will help you take you through the basic settings of the machine and help you set up.<br/><br/> Let’s watch the tutorial! Please turn on the subtitles.<br/><br/>',
            openBrowser: 'openBrowser',
            welcome: 'WELCOME',
            needNewUserTutorial: 'Welcome!\nDo you need a tutorial on Beam Studio?',
            needNewInterfaceTutorial: 'Welcome!\nDo you need an introduction to new interface of Beam Studio?',
            next: 'NEXT',
            newUser: {
                draw_a_circle: 'Draw a Circle',
                drag_to_draw: 'Drag to Draw',
                infill: 'Infill',
                switch_to_layer_panel: 'Switch to Layer Panel',
                set_preset_engraving: 'Set Preset - Engraving',
                set_preset_cut: 'Set Preset - Cutting',
                add_new_layer: 'Add a Layer',
                draw_a_rect: 'Draw a Rectangle',
                switch_to_preview_mode: 'Switch to Preview Mode',
                preview_the_platform: 'Preview the Platform',
                send_the_file: 'Send the File',
                end_alert: 'Are you sure to end tutorial?',
            },
            newInterface: {
                camera_preview: 'Camera Preview',
                select_image_text: 'Select / Image / Text',
                basic_shapes: 'Basic Shapes',
                pen_tool: 'Pen Tool',
                add_new_layer: 'Add New Layer',
                rename_by_double_click: 'Rename by double click',
                drag_to_sort: 'Drag to sort',
                layer_controls: 'Right Click to call Layer Controls:\nDuplicate / Merge / Lock / Delete Layers',
                switch_between_layer_panel_and_object_panel: 'Switch between Layer Panel and Object Panel',
                align_controls: 'Align Controls',
                group_controls: 'Group Controls',
                shape_operation: 'Shape Operation',
                flip: 'Flip',
                object_actions: 'Object Actions',
                end_alert: 'Are you sure to end new UI introduction?',
            },
        },
        slicer: {
            computing: 'Computing',
            error: {
                '6': 'Calculated toolpath is out of working area. Please reduce the size of the object(s), or try to turn off raft, brim or skirt.',
                '7': 'Error occurred while setting advanced parameters.',
                '8': 'Slicing:: API returned empty result.\nRequest for result is probably called before slice complete',
                '9': 'Slicing:: API returned empty path.\nRequest for toolpath is probably called before slice complete',
                '10': 'Slicing:: Missing object data. The source object is missing from slicer engine',
                '13': 'Slicing:: Duplication error\nThe selected ID does not exist. If the error is not resolved by restarting FLUX Studio, please report this error.',
                '14': 'Slicing:: Error occurred while setting position. The source object is missing in slicer engine.',
                '15': 'Slicing:: Uploaded file is corrupt, please check the file and try again.',
                '16': 'Slicing:: Slicing engine exited abnormally, kindly slice again.',
                '1006': 'WS closed unexpectedly, please obtain the bug report from the help menu and sent it to us.'
            },
            pattern_not_supported_at_100_percent_infill: 'Slic3r only supports 100% infill with rectilinear infill pattern'
        },
        calibration: {
            RESOURCE_BUSY: 'Please make sure the machine is in idle status',
            headMissing: 'Cannot retrieve head module information, please make sure it\'s attached',
            calibrated: 'Auto Leveling Completed',
            extruderOnly: 'Please use the printing toolhead for calibration'
        },
        head_info: {
            ID                  : 'ID',
            VERSION             : 'Firmware Version',
            HEAD_MODULE         : 'Toolhead Type',
            EXTRUDER            : 'Printing Toolhead',
            LASER               : 'Engraving Toolhead',
            USED                : 'Used',
            HARDWARE_VERSION    : 'Hardware Version',
            FOCAL_LENGTH        : 'Focal Length',
            hours               : 'Hours',
            cannot_get_info     : 'Toolhead type is unreadable'
        }
    };
});
