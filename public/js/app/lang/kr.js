define(function() {
    'use strict';

    return {
        general: {
            wait: '진행중, 잠시 기다려 주세요.'
        },
        buttons: {
            next: '다음'
        },
        topbar: {
            untitled: '언타이틀',
            titles: {
                settings: '환경설정'
            },
            zoom: '확대',
            group: '그룹화',
            ungroup: '그룹 해제',
            halign: '수평 맞춤',
            valign: '수직 맞춤',
            hdist: '수평 분배',
            vdist: '수직 분배',
            left_align: '왼쪽 맞춤',
            center_align: '가운데 맞춤',
            right_align: '오른쪽 맞춤',
            top_align: '상단 맞춤',
            middle_align: '중앙 맞춤',
            bottom_align: '하단 맞춤',
            union: '합치기',
            subtract: '빼기',
            intersect: '교차',
            difference: '차이',
            hflip: '수평 반전',
            vflip: '수직 반전',
            export: 'GO',
            preview: '미리보기',
            borderless: '(하단 열기)',
            tag_names: {
                rect: '직사각형',
                ellipse: '타원형',
                path: '경로',
                polygon: '다각형',
                image: '이미지',
                text: '텍스트',
                line: '라인',
                g: '그룹',
                multi_select: '여러 개체',
                use: '가져온 개체',
                svg: 'SVG 개체',
                dxf: 'DXF 개체',
            },
            alerts: {
                start_preview_timeout: '#803 미리보기 모드로 시작할 때 시간초과가 발생합니다. 기계 또는 빔스튜디오를 다시 시작해 주세요. 이 에러가 지속된다면 다음 가이드를 따라주세요. <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/360001111355">this guide</a>',
                fail_to_start_preview: '#803 미리보기 모드 시작 실패. 기계 또는 빔스튜디오를 다시 시작해 주세요. 이 에러가 지속된다면 다음 가이드를 따라 주세요. <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/360001111355">this guide</a>',
                power_too_high: '파워 너무 높음',
                power_too_high_msg: '70% 미만의 낮은 레이저 파워를 사용하면 레이저 튜브의 수명이 연장됩니다. 계속하려면 "확인"을 눌러주세요.',
                power_too_high_confirm: '확인',
            },
            hint: {
                polygon: '늘리기 / 줄이기를 위해 + /- 키를 누르세요.'
            },
        },
        support: {
            no_webgl: 'WebGL이 지원되지 않습니다. 다른 기기를 사용해 주세요.',
            no_vcredist: 'Visual C++ Redistributable 2015를 설치해 주세요. flux3dp.com에서 다운로드 가능합니다.',
            osx_10_9: 'OS X 10.9는 지원되지 않으므로 최신 버전으로 업데이트하세요.'
        },
        generic_error: {
            UNKNOWN_ERROR: '[UE] 알 수 없는 오류가 발생했습니다. Beam Studio와 기계를 다시 시작해 주세요.',
            OPERATION_ERROR: '[OE] 상태 충돌이 발생했습니다. 작업을 다시 시도해 주세요.',
            SUBSYSTEM_ERROR: '[SE] 기계 펌웨어가 작업을 실행하는 중 오류가 발생했습니다. 기계를 다시 시작해 주세요.',
            UNKNOWN_COMMAND: '[UC] 기기 펌웨어를 업데이트 해주세요.',
            RESOURCE_BUSY: '[RB] 기기를 다시 시작하거나 다시 시도하세요.'
        },
        device_selection: {
            no_printers: '네트워크를 통해 어떤 머신도 감지할 수 없습니다. PC와 머신이 동일한 네트워크에 연결되어 있는지 확인하세요. <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/215394548">More Info</a>',
            no_beambox: '#801 네트워크에서 기계를 찾을 수 없습니다.친절하게 <a target=""_blank"" href=""https://support.flux3dp.com/hc/en-us/articles/360001683556"">안내</a>를 따라 연결 문제를 해결해 주세요.',
            module: '모듈',
            status: '상태'
        },
        update: {
            release_note: '릴리스 노트:',
            firmware: {
                caption: '기계에 펌웨어 업데이트가 가능합니다',
                message_pattern_1: '%s이(가) 펌웨어 업데이트를 위해 준비되었습니다.',
                message_pattern_2: '%s 펌웨어 v%s이(가) 사용 가능합니다 - 현재 버전은 v%s입니다.',
                latest_firmware: {
                    caption: '기계 펌웨어 업데이트',
                    message: '최신 기계 펌웨어를 사용 중입니다',
                    still_update: '업데이트'
                },
                confirm: '업로드',
                upload_file: '펌웨어 업로드 (*.bin / *.fxfw)',
                update_success: '펌웨어 업데이트가 성공적으로 업로드되었습니다',
                update_fail: '#822 업데이트 실패'
            },
            software: {
                checking: '업데이트 확인 중',
                switch_version: '버전 전환',
                check_update: '업데이트 확인',
                caption: 'Beam Studio에 소프트웨어 업데이트가 있습니다',
                downloading: '백그라운드에서 업데이트를 다운로드하고 있습니다. 계속 작업하려면 "확인"을 클릭하세요.',
                install_or_not: '업데이트를 위해 준비되었습니다. 지금 다시 시작하고 업데이트하시겠습니까?',
                switch_or_not: '버전 전환을 위해 준비되었습니다. 지금 다시 시작하고 버전을 전환하시겠습니까?',
                message_pattern_1: 'Beam Studio 를 소프트웨어 업데이트할 준비가 되었습니다.',
                message_pattern_2: 'FLUX Software v%s 를 사용할 수 있습니다 - 현재 버전은 v%s입니다.',
                available_update: 'Beam Studio v%s이(가) 이제 사용 가능합니다. 현재 버전은 v%s입니다. 업데이트를 다운로드하시겠습니까?',
                available_switch: 'Beam Studio v%s이(가) 이제 사용 가능합니다. 현재 버전은 v%s입니다. 이 버전으로 전환하시겠습니까?',
                not_found: '최신 버전의 Beam Studio를 사용 중입니다.',
                no_response: '서버에 연결하지 못했습니다. 네트워크 설정을 확인해 주세요.',
                switch_version_not_found: '전환 가능한 버전을 찾을 수 없습니다.',
                yes: '예',
                no: '아니요',
                skip: '이 버전 건너뛰기'
            },
            toolhead: {
                caption: 'FLUX 툴헤드 펌웨어 업데이트 사용 가능.',
                message_pattern_1: '기계에 펌웨어 업데이트가 가능합니다.',
                message_pattern_2: '이제 FLUX 툴헤드 펌웨어 %s를 사용할 수 있습니다.',
                latest_firmware: {
                    caption: '툴헤드 펌웨어 업데이트.',
                    message: '최신 툴헤드 펌웨어가 있습니다.'
                },
                confirm: '업로드',
                upload_file: '펌웨어 업로드 (*.bin)',
                update_success: '툴헤드 펌웨어 업데이트가 성공적으로 업로드되었습니다.',
                update_fail: '업데이트 실패.',
                waiting: '툴헤드를 연결하세요.'
            },
            updating: '업데이트 중...',
            skip: '이 버전 건너뛰기',
            checkingHeadinfo: '툴헤드 정보 확인',
            preparing: '준비 중...',
            later: '나중에',
            download: '온라인 업데이트',
            cannot_reach_internet: '#823 서버에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요',
            install: '설치',
            upload: '업로드'
        },
        topmenu: {
            version: '버전',
            ok: '확인',
            sure_to_quit: '정말 그만두고 싶으신가요?',
            flux: {
                label: 'FLUX',
                about: '정보',
                preferences: '환경설정',
                quit: '끝내기'
            },
            file: {
                label: '파일',
                import: '가져오기',
                save_fcode: 'FLUX 작업 내보내기',
                save_scene: '장면 저장',
                save_svg: 'SVG 내보내기',
                save_png: 'PNG 내보내기',
                save_jpg: 'JPG 내보내기',
                converting: '이미지로 변환 중...',
                all_files: '모든 파일',
                svg_files: 'SVG',
                png_files: 'PNG',
                jpg_files: 'JPG',
                bvg_files: 'Beam Studio 장면',
                fcode_files: 'FLUX 코드',
                fsc_files: '3D 프린팅 장면',
                confirmReset: '모든 설정을 초기화하시겠습니까?',
                clear_recent: '최근 열린 항목 지우기',
                path_not_exit: '이 경로는 디스크에 더 이상 존재하지 않는 것 같습니다.'
            },
            edit: {
                label: '편집',
                duplicate: '복사본 만들기',
                rotate: '돌리기',
                scale: '스케일',
                clear: '장면 지우기',
                undo: '이전 실행',
                alignCenter: '중앙 정렬',
                reset: '재설정'
            },
            device: {
                label: '기계',
                new: '기계 설정',
                device_monitor: '대시보드',
                device_info: '기계 정보',
                head_info: '툴헤드 정보',
                change_filament: '인쇄 재료 변경',
                default_device: '기본값으로 설정',
                check_firmware_update: '펌웨어 업데이트',
                update_delta: '머신 펌웨어',
                update_toolhead: '툴헤드 펌웨어',
                calibrate: '자동 레벨링 실행',
                set_to_origin: '원산지 보정 ( 홈 )',
                movement_tests: '동작 테스트 실행',
                scan_laser_calibrate: '스캐닝 레이저 켜기',
                clean_calibration: '클린 데이터로 자동 레벨링 실행',
                commands: '명령',
                set_to_origin_complete: '기계가 원점을 보정했습니다.',
                scan_laser_complete: '기계가 스캐닝 레이저를 켰습니다. "마침"을 클릭하여 끕니다.',
                movement_tests_complete: '움직임 테스트 완료',
                movement_tests_failed: '이동 테스트에 실패했습니다. <br/>1. 툴헤드 케이블이 올바르게 늘어났는지 확인합니다.<br/>2. 기계에 연결된 공구 헤드 케이블의 커넥터가 기계에 절반 정도 삽입되었는지 확인합니다.<br/>3. 인쇄 도구 헤드의 커넥터를 180도 돌려보십시오.<br/>4. 확인 <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/115003674128">this article</a>.',
                download_log: '로그 다운로드',
                download_log_canceled: '로그 다운로드 취소',
                download_log_error: '알 수 없는 오류 발생, 나중에 다시 시도해 주세요',
                log: {
                    network: '네트워크',
                    hardware: '하드웨어',
                    discover: '찾기',
                    usb: 'USB',
                    usblist: 'USB 목록',
                    camera: '카메라',
                    cloud: '클라우드',
                    player: '플레이어',
                    robot: '로봇'
                },
                finish: '마침',
                cancel: '취소',
                turn_on_head_temperature: '공구 헤드 온도 설정',
                network_test: '네트워크 테스트'
            },
            window: {
                label: '윈도우',
                minimize: '최소화',
                fullscreen: '전체 화면'
            },
            help: {
                label: '도움말',
                help_center: '도움말',
                contact: '문의하기',
                tutorial: '인쇄 튜토리얼 시작하기',
                software_update: '소프트웨어 업데이트',
                debug: '버그 신고',
                forum: '커뮤니티 포럼'
            },
            account: {
                label: '계정',
                sign_in: '로그인',
                sign_out: '로그아웃'
            }
        },
        initialize: {
            // generic strings
            next: '다음',
            start: '시작',
            skip: '건너뛰기',
            cancel: '취소',
            confirm: '확인',
            connect: '연결',
            back: '뒤로',
            retry: '재시도',
            no_machine: '지금 기계가 없습니다.',

            // specific caption/content
            invalid_device_name: '이름에는 중국어, 알파벳, 숫자, 공백, 특수 문자만 포함할 수 있습니다. ( ) - _ ’ \'',
            require_device_name: '이름은 필수 입력 사항입니다.',
            select_language: '언어 선택',
            change_password: {
                content: '비밀번호를 정말 변경하시겠어요?',
                caption: '비밀번호 변경하기'
            },
            connect_flux: '머신 연결',
            via_usb: 'USB 케이블 사용',
            via_wifi: 'Wi-Fi 사용',
            select_machine_type: '모델 선택',
            select_connection_type: '어떻게 연결하시겠습니까?',
            connection_types: {
                wifi: 'Wi-Fi',
                wired: '유선 네트워크',
                ether_to_ether: '직접 연결',
            },
            connect_wifi: {
                title: 'Wi-Fi 연결 중',
                tutorial1: '1. 터치 패널로 이동 > "네트워크" 클릭 > "Wi-Fi 연결".',
                tutorial2: '2. 선호하는 Wi-Fi 선택 및 연결.',
                what_if_1: 'Wi-Fi를 찾지 못하면 어떻게 하나요?',
                what_if_1_content: '1. Wi-Fi 암호화 모드는 WPA2 또는 비밀번호가 없어야 합니다.\n2. 암호화 모드는 Wi-Fi 라우터 관리 인터페이스에서 설정할 수 있습니다. 라우터가 WPA2를 지원하지 않고 적합한 라우터를 선택하는 데 도움이 필요하면 FLUX 지원팀에 문의하십시오.',
                what_if_2: 'Wi-Fi를 전혀 찾지 못하면 어떻게 하나요?',
                what_if_2_content: '1. Wi-Fi 동글이 완전히 꽂혀 있는지 확인하세요.\n2. 터치스크린에 무선 네트워크의 MAC 주소가 없으면 FLUX 지원팀에 문의하십시오.\n3. Wi-Fi 채널은 2.4Ghz여야 합니다(5Ghz는 지원되지 않음).',
            },
            connect_wired: {
                title: '유선 네트워크 연결 중',
                tutorial1: '1. 기계를 라우터와 연결합니다.',
                tutorial2: '2. 네트워크를 눌러 유선 네트워크 IP를 확인하세요.',
                what_if_1: '만약 IP가 비어있다면?',
                what_if_1_content: '1. 이더넷 케이블이 완전히 꽂혀 있는지 확인하세요.\n2. 만약 터치스크린에 유선 네트워크의 MAC 주소가 없다면, FLUX 지원팀에 문의하세요.',
                what_if_2: '만약 IP가 169로 시작한다면?',
                what_if_2_content: '1. IP 주소가 169.254로 시작된다면, DHCP 설정 문제일 수 있습니다. 인터넷 서비스 제공자에게 문의하세요.\n2. 만약 컴퓨터가 PPPoE를 사용하여 직접 인터넷에 연결되어 있다면, 라우터를 사용하여 PPPoE를 사용하도록 변경하고 라우터에서 DHCP 기능을 사용하도록 설정하세요.'
            },
            connect_ethernet: {
                title: '직접 연결',
                tutorial1: '1. 이더넷 케이블로 기계를 컴퓨터에 연결하세요.',
                tutorial2_1: '2. 다음 가이드를',
                tutorial2_a_text: '따라',
                tutorial2_a_href_mac: 'https://support.flux3dp.com/hc/en-us/articles/360001517076',
                tutorial2_a_href_win: 'https://support.flux3dp.com/hc/en-us/articles/360001507715',
                tutorial2_2: '컴퓨터를 라우터로 설정하세요.',
                tutorial3: '3. 다음을 클릭하세요.',
            },
            connect_machine_ip: {
                enter_ip: '기계 IP를 입력하세요.',
                check_ip: 'IP 가용성 확인',
                check_firmware: '펌웨어 버전 확인',
                check_camera: '카메라 가용성 확인',
                retry: '재시도',
                finish_setting: '설정 완료'
            },
            name_your_flux: '머신 이름 지정',
            wifi_setup: 'Wi-Fi 설정',
            select_preferred_wifi: '선호하는 네트워크를 선택합니다.',
            requires_wifi_password: '비밀번호가 필요합니다.',
            connecting: '연결 중...',

            set_connection: '%s 연결 설정',
            please_goto_touchpad: 'Beambox 터치패드로 이동하세요.',
            tutorial: '1. 기기의 클릭 터치 패널에서 "네트워크" > "WiFi 설정"을 클릭합니다."\n2. Wi-Fi를 선택하고 비밀번호를 입력합니다.\n3. 10초간 기다리면 무선 IP 주소가 "설정" > "인터넷"에 표시됩니다.\n4. Wi-Fi를 사용할 수 없는 경우, DHCP가 활성화된 라우터를 사용하여 이더넷 포트에 연결하세요.\n5. 여기에 머신 IP 입력  ',
            please_see_tutorial_video: '튜토리얼 비디오',
            tutorial_url: 'https://flux3dp.com/beambox-tutorial/',
            ip_wrong: 'IP 형식이 잘못되었습니다. 다시 입력하세요.',

            set_machine_generic: {
                printer_name: 'Name*',
                printer_name_placeholder: '머신에 고유한 이름 부여',
                old_password: '현재 비밀번호',
                password: '비밀번호',
                set_station_mode: '네트워크 만들기',
                password_placeholder: '비밀번호로 기계  보안 유지',
                incorrect_old_password: '현재 비밀번호가 잘못되었습니다.',
                incorrect_password: '#828 잘못된 비밀번호',
                ap_mode_name: '네트워크 이름',
                ap_mode_pass: '비밀번호',
                ap_mode_name_format: '알파벳 또는 숫자만 허용',
                ap_mode_pass_format: '8자 이상',
                ap_mode_name_placeholder: '최대 32자까지 입력할 수 있습니다.',
                ap_mode_pass_placeholder: '8자 이상이어야 합니다.',
                create_network: '네트워크 만들기',
                join_network: '다른 네트워크 가입',
                security: '보안'
            },

            setting_completed: {
                start: '시작',
                is_ready: '“%s” 준비 완료',
                station_ready_statement: '이제 컴퓨터가 Wi-Fi 스테이션이 되었으며 Wi-Fi "%s"에 연결하여 컴퓨터를 무선으로 사용할 수 있습니다.',
                brilliant: '훌륭합니다!',
                begin_journey: '이제 USB/마이크로 USB 케이블을 분리하고 창의력의 여정을 시작할 수 있습니다.',
                great: 'Beam Studio에 오신 것을 환영합니다.',
                setup_later: '언제든지 타이틀바 > "머신" > "머신 설정"에서 머신을 설정할 수 있습니다.',
                upload_via_usb: 'Wi-Fi 연결은 나중에 설정할 수 있습니다. <br/>Wi-Fi가 없는 경우 다음을 확인하세요 <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/215998327-Connection-Guide-for-Desktop-PCs">Desktop Connection Guide</a>.',
                back: '뒤로',
                ok: '만들기 시작'
            },

            notice_from_device: {
                headline: '기기에서 Wi-Fi 표시기를 확인하세요.',
                subtitle: 'Wi-Fi 연결 상태에 유의하시기 바랍니다.',
                light_on: '조명 켜짐',
                light_on_desc: '기계 할당된 Wi-Fi에 연결되었습니다.',
                breathing: '호흡',
                breathing_desc: 'Wi-Fi 연결에 실패했습니다. 다시 설정해 보세요.',
                successfully: '컴퓨터가 성공적으로 연결되면',
                successfully_statement: 'Wi-Fi 목록으로 돌아가서 PC를 %s에 연결한 다음 FLUX Studio를 다시 시작하세요.',
                restart: 'FLUX Studio 재시작'
            },

            // errors
            errors: {
                error: '오류',
                close: '닫기',
                not_found: '찾을 수 없음',
                not_support: 'USB를 통해 머신 펌웨어를 v1.6 이상으로 업데이트하세요.',

                keep_connect: {
                    caption: 'USB 연결을 찾을 수 없음',
                    content: 'Oops! 걱정하지 마세요. 저희가 도와드리겠습니다.\n확인\n1. Wi-Fi 표시등(녹색 LED)이 깜박이거나 숨을 쉬고 있거나 계속 켜져 있는지 확인합니다.\n2. 드라이버가 올바르게 설치되었습니다. <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/215327328">(More Info)</a>\n3. 다시 연결하고 10초간 기다립니다.'
                },

                wifi_connection: {
                    caption: '연결할 수 없습니다.',
                    connecting_fail: 'Wi-Fi 신호가 강하고 비밀번호가 올바른지 확인하세요.'
                },

                select_wifi: {
                    ap_mode_fail: '설정 실패!'
                }
            }
        },
        wifi: {
            home: {
                line1: '사용 가능한 Wi-Fi가 있나요?',
                line2: 'FLUX가 Wi-Fi에 연결될 수 있도록 지원합니다.',
                select: '예'
            },
            set_password: {
                line1: '입력하세요"',
                line2: '"Wi-Fi 네트워크의 비밀번호입니다.',
                password_placeholder: '여기에 Wi-Fi 비밀번호 입력',
                back: '뒤로',
                join: '가입',
                connecting: '연결'
            },
            success: {
                caption: '좋아요! 연결에 성공했습니다!',
                line1: '이제 머신에 대한 몇 가지 간단한 설정을 해보겠습니다.',
                next: '다음'
            },
            failure: {
                caption: '연결하지 못했습니다.',
                line1: 'Wi-Fi가 제대로 작동하는지 확인한 후 다시 연결하세요.',
                next: '다시 연결'
            },
            set_printer: {
                caption: 'FLUX3D 프린터의 이름과 비밀번호를 설정합니다.',
                printer_name: '이름',
                printer_name_placeholder: '세트 이름',
                password: '비밀번호',
                password_placeholder: '비밀번호 설정',
                notice: '비밀번호를 설정하여 비밀번호를 아는 사람만 플럭스 델타를 사용할 수 있도록 합니다.',
                next: '다음'
            }
        },
        menu: {
            print: '인쇄',
            laser: '인그레이빙',
            scan: '스캔',
            usb: 'USB',
            device: '머신',
            setting: '설정',
            draw: '그리기',
            cut: '절단',
            beambox: 'BEAMBOX',
            mill: '밀링',
            mm: 'mm',
            inches: '인치'
        },
        settings: {
            on: '켜기',
            off: '끄기',
            low: '낮은',
            high: '보통',
            caption: '설정',
            tabs: {
                general: '일반',
                device: '기계'
            },
            ip: '기계 IP 주소',
            guess_poke: '기계 IP 주소 검색',
            auto_connect: '유일한 기계 자동 선택',
            wrong_ip_format: '잘못된 IP 형식',
            lock_selection: '잠금 선택',
            default_machine: '기본 기계',
            default_machine_button: '비어 있음',
            remove_default_machine_button: '제거',
            confirm_remove_default: '기본 기계가 제거됩니다.',
            reset: 'Beam Studio 재설정',
            reset_now: 'Beam Studio 재설정',
            confirm_reset: 'Beam Studio 재설정을 확인하시겠습니까?',
            language: '언어',
            notifications: '데스크톱 알림',
            check_updates: '자동 확인',
            updates_version: '버전',
            default_app: '기본 앱',
            default_units: '기본 단위',
            default_font_family: '기본 글꼴',
            default_font_style: '기본 글꼴 스타일',
            fast_gradient: '속도 최적화',
            vector_speed_constraint: '속도 제한 (20mm/s)',
            loop_compensation: '루프 보정',
            blade_radius: '블레이드 반경',
            blade_precut_switch: '블레이드 프리컷',
            blade_precut_position: '프리컷 위치',
            delta_series: 'Delta Family',
            beambox_series: 'Beambox Family',
            default_model: '기본 모델<br />(For Print Settings)',
            default_beambox_model: '기본 문서 설정',
            guides_origin: '가이드 원점',
            guides: '가이드',
            image_downsampling: '비트맵 미리보기 품질',
            continuous_drawing: '연속 그리기',
            mask: '작업 영역 클리핑',
            text_path_calc_optimization: '경로 계산 최적화',
            font_substitute: '지원되지 않는 문자 대체',
            default_borderless_mode: '열린 밑면 기본 설정',
            default_enable_autofocus_module: '오토포커스 기본 설정',
            default_enable_diode_module: '하이브리드 레이저 기본 설정',
            diode_offset: '하이브리드 레이저 오프셋',
            none: '없음',
            close: '닫기',
            enabled: '사용',
            disabled: '사용 안 함',
            cancel: '취소',
            done: '적용',
            groups: {
                general: '일반',
                update: '소프트웨어 업데이트',
                connection: '연결',
                editor: '에디터',
                engraving: '레스터링 (스캔)',
                path: '벡터 (윤곽)',
                mask: '작업 영역 클리핑',
                text_to_path: '텍스트',
                modules: '애드온',
            },
            connect_printer: {
                title: '프린터와 연결'
            },
            notification_on: '켜기',
            notification_off: '끄기',
            update_latest: '최신',
            update_beta: '베타',
            engine_change_fail: {
                'caption': '엔진을 변경할 수 없음',
                '1': '확인 중 오류',
                '2': 'cura 버전 오류',
                '3': '경로가 cura가 아님',
                '4': '경로가 존재하지 않는 파일인 경우 설정 섹션에서 엔진 경로를 확인하십시오.'
            },
            allow_tracking: '앱 개선을 위해 익명의 사용 통계를 FLUX에 보내시겠습니까?',
            flux_cloud: {
                processing: '처리 중...',
                flux_cloud: 'FLUX CLOUD',
                back: '뒤로',
                next: '다음',
                done: '완료',
                sign_in: '로그인',
                sign_up: '가입하기',
                success: '성공',
                fail: '실패',
                cancel: '취소',
                try_again: '다시 시도',
                bind: '바인드',
                bind_another: '다른 사람과 바인딩',
                username: '사용자 이름',
                nickname: '닉네임',
                email: '이메일',
                password: '비밀번호',
                re_enter_password: '비밀번호 재입력',
                forgot_password: '비밀번호를 잊어버리셨나요?',
                sign_up_statement: 'FLUX ID가 없는 경우 여기에서 <a href="%s">SIGN UP</a>.',
                try_sign_up_again: '다시 시도해 주세요. <a href="%s">SIGN UP</a> ',
                agreement: 'FLUX에 동의 <a href="#/studio/cloud/privacy">Privacy</a>, <a href="#/studio/cloud/terms">Terms & Conditions</a>',
                pleaseSignIn: 'FLUX ID로 로그인하세요.',
                enter_email: '이메일 주소를 입력해 주세요.',
                check_inbox: '메일함을 확인해 보세요!',
                error_blank_username: '닉네임은 비워둘 수 없습니다.',
                error_blank_email: '이메일은 비워 둘 수 없습니다.',
                error_email_format: '정확한 이메일을 입력하세요.',
                error_email_used: '이메일 주소가 사용되었습니다.',
                error_password_not_match: '비밀번호가 확인 비밀번호와 일치하지 않습니다.',
                select_to_bind: '바인딩할 머신 선택',
                binding_success: '머신을 성공적으로 바인딩했습니다!',
                binding_success_description: '이제 FLUX 앱을 사용하여 장비 상태를 확인할 수 있습니다.',
                binding_fail: '바인딩 실패',
                binding_fail_description: '네트워크 오류일 수 있습니다. 다시 시도해 보세요.',
                binding_error_description: '컴퓨터의 클라우드 기능을 켤 수 없습니다. 오류 로그와 함께 지원팀에 문의하세요.',
                retrieve_error_log: '다운로드 오류',
                binding: '바인딩...',
                check_email: '이메일에서 지침을 확인하세요.',
                email_exists: '이메일이 있습니다.',
                not_verified: '이메일이 확인되지 않았습니다.',
                user_not_found: '잘못된 이메일 또는 비밀번호',
                resend_verification: '인증 이메일 다시 보내기',
                contact_us: '이메일과 발생한 문제를 FLUX 지원팀에 문의하세요.',
                confirm_reset_password: '비밀번호를 재설정하시겠습니까?',
                format_error: '잘못된 자격 증명',
                agree_to_terms: '약관에 동의해 주세요.',
                back_to_list: '목록으로 돌아가기',
                change_password: '비밀번호 변경',
                current_password: '현재 비밀번호',
                new_password: '새 비밀번호',
                confirm_password: '비밀번호 확인',
                empty_password_warning: '비밀번호는 비워 둘 수 없습니다.',
                WRONG_OLD_PASSWORD: '현재 비밀번호가 잘못되었습니다.',
                FORMAT_ERROR: '잘못된 비밀번호 형식',
                submit: '저장',
                sign_out: '로그아웃',
                not_supported_firmware: '클라우드 기능을 사용하려면\n 머신 펌웨어를 v1.5 이상으로 업그레이드하세요.',
                unbind_device: '이 머신의 바인딩을 해제하시겠습니까?',
                CLOUD_SESSION_CONNECTION_ERROR: '컴퓨터가 클라우드 서버에 액세스할 수 없습니다. 기기를 재부팅하세요.',
                CLOUD_UNKNOWN_ERROR: '컴퓨터가 클라우드 서버에 연결할 수 없습니다. 기기를 재부팅하세요.',
                SERVER_INTERNAL_ERROR: '서버 내부 오류가 발생했습니다. 나중에 다시 시도하세요.',
            }
        },
        print: {
            import: '가져오기',
            save: '저장',
            start_print: '인쇄',
            gram: 'g',
            advanced: {
                general: '일반',
                layers: '레이어',
                infill: '채우기',
                support: '지원',
                speed: '속도',
                custom: '텍스트',
                slicingEngine: '슬라이싱 엔진',
                slic3r: 'Slic3r',
                cura: 'Cura',
                cura2: 'Cura2',
                filament: '필라멘트',
                temperature: '소재 및 온도',
                detect_filament_runout: '필라멘트 감지',
                flux_calibration: '자동 보정',
                detect_head_tilt: '기울기 감지',
                layer_height_title: '레이어 높이',
                layer_height: '레이어 높이',
                firstLayerHeight: '첫 번째 레이어 높이',
                shell: 'Shell',
                shellSurface: 'Shell Surface',
                solidLayerTop: 'Solid Layer: Top',
                solidLayerBottom: 'Solid Layer: Bottom',
                density: '밀도',
                pattern: '패턴',
                auto: 'auto',                       // do not change
                line: 'Line',                       // do not change
                rectilinear: 'Rectilinear',         // do not change
                rectilinearGrid: 'Rectilinear Grid',// do not change
                honeycomb: 'Honeycomb',             // do not change
                offset: '오프셋',
                xyOffset: '수평 확장',
                zOffset: 'Z 오프셋',
                cutBottom: '하단 잘라내기',
                curaInfill: {
                    automatic: '자동',
                    grid: '그리드',
                    lines: '라인',
                    concentric: '동심원',
                    concentric_3d: '동심 3D',
                    cubic: '큐빅',
                    cubicsubdiv: '큐빅 세분화',
                    tetrahedral: '사면체',
                    triangles: '트라이앵글',
                    zigzag: '지그재그'
                },
                curaSupport: {
                    lines: '라인',
                    grid: '그리드',
                    zigzag: '지그재그'
                },
                blackMagic: '블랙 매직',
                spiral: '나선형',
                generalSupport: '일반 지원',
                spacing: '라인 거리',
                overhang: '오버행',
                zDistance: 'Z 거리',
                raft: '뗏목',
                raftLayers: '뗏목 레이어',
                brim: '테두리 폭',
                skirts: '스커트',
                movement: '이동',
                structure: '구조',
                traveling: '여행',
                surface: '표면',
                firstLayer: '첫 번째 레이어',
                solidLayers: '솔리드 레이어',
                innerShell: '이너 쉘',
                outerShell: '외부 셸',
                bridge: '다리',
                config: '전문가 설정',
                presets: '컨피그',
                name: '이름',
                apply: '신청하기',
                save: '저장',
                saveAsPreset: '구성 저장',
                cancel: '취소',
                delete: '삭제',
                loadPreset: '구성 로드',
                savePreset: '구성 저장',
                reloadPreset: '구성 초기화',
                printing: '인쇄',
                firstLayerTemperature: '첫 번째 레이어',
                flexibleMaterial: '유연한 소재'
            },
            mode: [
                {
                    value: 'beginner',
                    label: '초보자',
                    checked: true
                },
                {
                    value: 'expert',
                    label: '전문가'
                }
            ],
            params: {
                beginner: {
                    print_speed: {
                        text: '인쇄 속도',
                        options: [
                            {
                                value: 'slow',
                                label: '느린',
                                selected: true
                            },
                            {
                                value: 'fast',
                                label: '빠른'
                            }
                        ]
                    },
                    material: {
                        text: '재질',
                        options: [
                            {
                                value: 'pla',
                                label: 'PLA',
                                selected: true
                            }
                        ]
                    },
                    support: {
                        text: '지원',
                        on: '켜기',
                        off: '끄기',
                        options: [
                            {
                                value: 'Touching',
                                label: '터치',
                                checked: true
                            },
                            {
                                value: 'nowhere',
                                label: '아무데도'
                            }
                        ]
                    },
                    platform: {
                        text: '플랫폼',
                        options: [
                            {
                                value: 'raft',
                                label: '뗏목',
                                checked: true
                            }
                        ]
                    }
                },
                expert: {
                    layer_height: {
                        text: '레이어 높이',
                        value: 0.3,
                        unit: 'mm'
                    },
                    print_speed: {
                        text: '인쇄 속도',
                        value: 50,
                        unit: 'mm/s'
                    },
                    temperature: {
                        text: '온도',
                        value: 231,
                        unit: '°C'
                    },
                    support: {
                        text: '지원',
                        options: [
                            {
                                value: 'everywhere',
                                label: '어디서나',
                                checked: true
                            },
                            {
                                value: 'nowhere',
                                label: '아무데도'
                            }
                        ]
                    },
                    platform: {
                        text: '플랫폼',
                        options: [
                            {
                                value: 'raft',
                                label: '뗏목',
                                checked: true
                            }
                        ]
                    }
                }
            },
            left_panel: {
                raft_on: '래프트 켜기',
                raft_off: '래프트 끄기',
                support_on: '지원 켜기',
                support_off: '지원 끄기',
                advanced: '고급',
                preview: '미리 보기',
                plaTitle: '필라멘트 색상 선택',
                transparent: '투명',
                raftTitle: '래프트는 부품 아래에 제작되어 부품이 베이스 플레이트에 잘 붙도록 도와주는 레이어입니다.',
                supportTitle: '서포트는 필라멘트가 떨어지는 것을 방지하기 위해 오브젝트의 돌출된 부분을 지지하기 위해 생성되는 구조물입니다.',
                advancedTitle: '세부 3D 프린팅 매개 변수를 조정하여 기본값보다 더 나은 결과를 얻을 수 있습니다.',
                confirmExitFcodeMode: '미리보기 모드를 종료하면 FCode가 언로드되나요?'
            },
            right_panel: {
                get: '받기',
                go: 'Go',
                preview: '미리보기'
            },
            quality: {
                high: '높은 품질',
                med: '중간 품질',
                low: '낮은 품질',
                custom: '맞춤 품질'
            },
            model: {
                fd1: 'DELTA',
                fd1p: 'DELTA+'
            },
            scale: '규모',
            rotate: '회전',
            delete: '삭제',
            reset: '초기화',
            cancel: '취소',
            done: '완료',
            pause: '일시 중지',
            restart: '다시 시작',
            download_prompt: '파일 이름을 입력하세요.',
            importTitle: '3D 모델 가져오기(.stl)',
            getFcodeTitle: '툴헤드 경로와 구성을 FCode 파일( *.fc)에 저장합니다.',
            goTitle: '인쇄 준비',
            deviceTitle: '머신 모니터 표시',
            rendering: '슬라이싱',
            reRendering: '재슬라이싱',
            finishingUp: '마무리...',
            savingFilePreview: '파일 저장 미리보기',
            uploading: '슬라이싱 엔진에 업로드',
            uploaded: '업로드됨, 슬라이싱 엔진이 처리 중...',
            importingModel: '모델 가져오기',
            wait: '잠시만 기다려주세요...',
            out_of_range: '범위를 벗어남',
            out_of_range_message: '개체의 크기를 줄여주세요.',
            drawingPreview: '그리기 미리보기 경로, 잠시만 기다려주세요.',
            gettingSlicingReport: '슬라이싱 상태 가져오기'
        },
        draw: {
            pen_up: '이동 높이',
            pen_down: '그리기 높이',
            speed: '속도',
            pen_up_title: '펜이 드로잉 표면에 닿지 않는 높이입니다.',
            pen_down_title: '펜이 드로잉 표면에 닿는 높이는 이동 높이보다 낮아야 합니다.',
            speed_title: '그리기 속도',
            units: {
                mms: 'mm/s',
                mm: 'mm'
            }
        },
        cut: {
            horizontal_calibrate: '수평 조정',
            height_calibrate: '높이 조절',
            running_horizontal_adjustment: '가로 조정 실행...',
            running_height_adjustment: '높이 조절...',
            run_height_adjustment: '칼날을 조정하고 높이 조절을 실행하세요.',
            horizontal_adjustment_completed: '수평 조정 완료됨',
            height_adjustment_completed: '높이 조정 완료',
            you_can_now_cut: '축하합니다! 이제 시트 자르기를 시작할 수 있습니다.',
            zOffset: '높이 오프셋',
            overcut: '오버컷',
            speed: '속도',
            bladeRadius: '블레이드 반경',
            backlash: '백래시 보상',
            zOffsetTip: '두꺼운 비닐을 자르거나 너무 세게 또는 너무 가볍게 자르지 않도록 절단 높이를 조정합니다.',
            overcutTip: '쉽게 떼어낼 수 있는 오버컷 루프',
            speedTip: '절단 속도',
            backlashTip: '타사 블레이드를 사용할 때 직선이 충분히 직선이 아닌 경우 값을 조정합니다.',
            units: {
                mms: 'mm/s',
                mm: 'mm'
            }
        },
        mill: {
            calibrate: '자동 레벨',
            zOffset: '절단 높이',
            overcut: '오버컷',
            speed: '속도',
            repeat: '반복',
            stepHeight: '스텝 높이',
            backlash: '백래시 보상',
            zOffsetTip: '두꺼운 비닐을 위해 절단 높이를 조정하고 너무 세게 또는 너무 가볍게 절단하지 않도록 합니다.',
            overcutTip: '쉽게 떼어낼 수 있는 오버컷 루프',
            speedTip: '절단 속도',
            backlashTip: '직선이 충분히 직선이 아닌 경우 값을 조정합니다.',
            units: {
                mms: 'mm/s',
                mm: 'mm'
            }
        },
        laser: {
            import: '가져오기',
            save: '저장',
            custom: '사용자 지정',
            presets: '구성 로드',
            button_advanced: '고급',
            confirm: '확인',
            get_fcode: '작업<br/>저장',
            export_fcode: '파일로 저장 ...',
            name: '이름',
            go: 'GO',
            showOutline: '프레임\n보기',
            do_calibrate: '인그레이빙을 처음 사용하는 것 같다면 패키지에 들어 있는 크래프트 카드를 사용하여 최적의 초점 거리를 찾을 수 있습니다. 보정 이미지를 로드하시겠습니까? 나중에 "고급"에서 로드할 수도 있습니다.',
            process_caption: '생성',
            laser_accepted_images: '지원되는 형식: BMP/GIF/JPG/PNG/SVG',
            draw_accepted_images: '지원되는 형식: SVG',
            svg_fail_messages: {
                'TEXT_TAG': 'SVG 태그 &lt;text&gt; 는 지원되지 않습니다.',
                'DEFS_TAG': 'SVG 태그 &lt;defs&gt; 는 지원되지 않습니다.',
                'CLIP_TAG': 'SVG 태그 &lt;clip&gt; 는 지원되지 않습니다.',
                'FILTER_TAG': 'SVG 태그 &lt;filter&gt; 는 지원되지 않습니다.',
                'EMPTY': '은 빈 파일입니다.',
                'FAIL_PARSING': '구문 분석 과정에서 실패했습니다.',
                'SVG_BROKEN': '고장났습니다.',
                'NOT_SUPPORT': '이 파일은 SVG가 아닙니다.'
            },
            title: {
                material: '최상의 인그레이빙 결과를 얻으려면 적절한 재료를 선택하세요.',
                object_height: '베이스 플레이트에서 물체의 최대 높이까지 측정한 물체 높이.',
                height_offset: '최상의 레이저 포커싱을 위해 Z 위치 조정',
                shading: '음영을 사용하면 레이저 조각의 그라데이션 효과를 얻을 수 있습니다. 시간이 더 오래 걸립니다.',
                advanced: '전원 및 속도에 대한 사용자 지정 설정.'
            },
            print_params: {
                object_height: {
                    text: '개체 높이',
                    unit: 'mm'
                },
                height_offset: {
                    text: '초점 오프셋',
                    unit: 'mm'
                },
                shading: {
                    text: '쉐이딩',
                    textOn: 'ON',
                    textOff: 'OFF',
                    checked: true
                }
            },
            object_params: {
                position: {
                    text: '포지션'
                },
                size: {
                    text: '크기',
                    unit: {
                        width: 'W',
                        height: 'H'
                    }
                },
                rotate: {
                    text: '회전'
                },
                threshold: {
                    text: '임계값',
                    default: 128
                }
            },
            advanced: {
                label: '설정',
                form: {
                    object_options: {
                        text: '재질',
                        label: '개체 옵션',
                        options: [
                            {
                                value: 'cardboard',
                                label: '크래프트페이퍼',
                                data: {
                                    laser_speed: 10,
                                    power: 255
                                }
                            },
                            {
                                value: 'wood',
                                label: '나무',
                                data: {
                                    laser_speed: 3,
                                    power: 255
                                }
                            },
                            {
                                value: 'leather',
                                label: '가죽',
                                data: {
                                    laser_speed: 5,
                                    power: 255
                                }
                            },
                            {
                                value: 'paper',
                                label: '논문',
                                data: {
                                    laser_speed: 2,
                                    power: 255
                                }
                            },
                            {
                                value: 'cork',
                                label: '코크',
                                data: {
                                    laser_speed: 5,
                                    power: 255
                                }
                            },
                            {
                                value: 'other',
                                label: '기타',
                                data: {}
                            }
                        ]
                    },
                    laser_speed: {
                        text: '레이저 속도',
                        unit: 'mm/s',
                        fast: '빠른',
                        slow: '느린',
                        min: 0.8,
                        max: 20,
                        step: 0.1
                    },
                    power: {
                        text: '파워',
                        high: '높음',
                        low: '낮음',
                        min: 0,
                        max: 255,
                        step: 1
                    }
                },
                save_and_apply: '저장 및 적용',
                save_as_preset: '저장',
                save_as_preset_title: '구성 저장',
                load_preset_title: '구성 로드',
                background: '배경',
                removeBackground: ' 배경 제거',
                removePreset: '선택한 프리셋이 재부팅됩니다.',
                load_calibrate_image: '보정 이미지 로드',
                apply: '신청하기',
                cancel: '취소',
                save: '저장'
            }
        },
        scan: {
            stop_scan: '중지',
            over_quota: '할당량 초과',
            convert_to_stl: '변환',
            scan_again: '다시 스캔',
            start_multiscan: '추가 스캔',
            processing: '처리...',
            remaining_time: '왼쪽',
            do_save: 'STL 저장',
            go: 'Go',
            rollback: '뒤로',
            error: '오류',
            confirm: '확인',
            caution: '주의',
            cancel: '취소',
            delete_mesh: '삭제?',
            quality: '품질',
            scan_again_confirm: '현재 스캔 결과를 삭제하시겠습니까?',
            calibrate: '보정',
            calibration_done: {
                caption: '보정 완료',
                message: '지금 스캔할 수 있습니다.'
            },
            cant_undo: '실행 취소할 수 없음',
            estimating: '시간 예상하기...',
            calibrate_fail: '보정 실패',
            calibration_is_running: '스캔 보정',
            calibration_firmware_requirement: '펌웨어를 1.6.9 이상으로 업그레이드하세요.',
            resolution: [{
                id: 'best',
                text: '최고',
                time: '~30분',
                value: 1200
            },
            {
                id: 'high',
                text: '높음',
                time: '~20분',
                value: 800
            },
            {
                id: 'normal',
                text: '보통',
                time: '~10분',
                value: 400
            },
            {
                id: 'low',
                text: '낮음',
                time: '~5분',
                value: 200
            },
            {
                id: 'draft',
                text: '초안',
                time: '~2분',
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
                filter: '필터',
                position: '포지션',
                size: '크기',
                rotate: '회전',
                crop: '자르기',
                manual_merge: '병합',
                clear_noise: '노이즈 제거',
                save_pointcloud: '내보내기'
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
                    caption: '카메라가 감지되지 않음 / 너무 어둡습니다',
                    message: '마지막에 소리가 날 때까지 스캔 카메라를 떼어주세요.'
                },
                'no object': {
                    caption: '보정 도구가 감지되지 않음',
                    message: '보정 도구를 중앙 슬롯에 삽입하고 조명이 충분한지 확인합니다.'
                },
                'no laser': {
                    caption: '스캐닝 레이저가 감지되지 않음',
                    message: '레이저 헤드를 눌러서 열고 조명이 너무 강하지 않은지 확인합니다.'
                }
            }
        },
        beambox: {
            tag:{
                g: '그룹',
                use: 'Import SVG',
                image: '이미지',
                text: '텍스트'
            },
            toolbox: {
                ALIGN_LEFT: '왼쪽 정렬',
                ALIGN_RIGHT: '오른쪽 정렬',
                ALIGN_TOP: '상단 정렬',
                ALIGN_BOTTOM: '하단 정렬',
                ALIGN_CENTER: '정렬 센터',
                ALIGN_MIDDLE: '가운데 정렬',
                ARRANGE_HORIZON: '가로로 정렬',
                ARRANGE_VERTICAL: '세로로 정렬',
                ARRANGE_DIAGONAL: '대각선으로 정렬'
            },
            popup: {
                select_favor_input_device: '사용자 환경이 최적화되었습니다<br/>원하는 입력 장치를 선택하세요.',
                select_import_method: '레이어링 스타일 선택:',
                touchpad: '터치패드',
                mouse: '마우스',
                layer_by_layer: '레이어',
                layer_by_color: '색상',
                nolayer: '단일 레이어',
                loading_image: '이미지를 로드 중입니다. 잠시 기다려주세요...',
                no_support_text: 'Beam Studio는 현재 텍스트 태그를 지원하지 않습니다. 가져오기 전에 텍스트를 경로로 변환해주세요.',
                speed_too_high_lower_the_quality: '이 해상도에서 너무 높은 속도를 사용하면 그림자 조각에 대한 품질이 낮아질 수 있습니다.',
                both_power_and_speed_too_high: '낮은 레이저 파워를 사용하면 레이저 튜브의 수명이 연장됩니다. 또한, 이 해상도에서 너무 높은 속도를 사용하면 그림자 조각에 대한 품질이 낮아질 수 있습니다.',
                too_fast_for_path: '경로 객체를 포함한 레이어에서 너무 높은 속도를 사용하면 절단 정밀도가 낮아질 수 있습니다. 절단할 때 20mm/s보다 빠른 속도를 사용하지 않는 것이 좋습니다.',
                too_fast_for_path_and_constrain: '다음 레이어: %s 벡터 경로 객체를 포함하고, 속도가 20mm/s를 초과합니다. 벡터 경로 객체의 절단 속도는 20mm/s로 제한됩니다. 이 제한을 기본 설정에서 제거할 수 있습니다.',
                should_update_firmware_to_continue: '#814 당신의 펌웨어는 이 버전의 Beam Studio를 지원하지 않습니다. 펌웨어를 업데이트해주세요. (메뉴 > 기계 > [당신의 기계] > 펌웨어 업데이트)',
                more_than_two_object: '오브젝트 수가 너무 많습니다. 2개의 오브젝트만 지원됩니다.',
                not_support_object_type: '오브젝트 유형이 지원되지 않습니다.',
                select_first: '먼저 오브젝트를 선택해주세요.',
                select_at_least_two: '진행하려면 두 개의 오브젝트를 선택해주세요.',
                import_file_contain_invalid_path: '#808 가져온 SVG 파일에는 잘못된 이미지 경로가 포함되어 있습니다. 모든 이미지 파일이 존재하거나 이미지를 파일에 포함시켰는지 확인해주세요.',
                import_file_error_ask_for_upload: 'SVG 파일을 가져오는 데 실패했습니다. 버그 보고를 위해 개발팀에 파일을 제공하시겠습니까?',
                upload_file_too_large: '#819 파일이 업로드하기에 너무 큽니다.',
                successfully_uploaded: '파일 업로드가 성공했습니다.',
                upload_failed: '#819 파일 업로드 실패.',
                or_turn_off_borderless_mode: '혹은 Open Bottom 모드를 끄세요.',
                svg_1_1_waring: '이 SVG 파일의 버전은 v 1.1이며, 호환성 문제가 있을 수 있습니다.',
                svg_image_path_waring: '이 SVG 파일은 파일 경로에서 <image>를 로딩하고 있습니다. 이로 인해 로딩 실패가 발생할 수 있습니다. 이러한 위험을 피하기 위해 SVG 내장 이미지를 사용해 주세요.',
                dxf_version_waring: '이 DXF 파일의 버전이 2013이 아닌 경우 호환성 문제가 있을 수 있습니다.',
                dont_show_again: '다음에는 이 메시지를 표시하지 않습니다.',
                convert_to_path_fail: '경로로 변환 실패.',
                save_unsave_changed: '저장하지 않은 변경 사항을 저장하시겠습니까?',
                dxf_bounding_box_size_over: '도면 크기가 작업 영역을 벗어났습니다. CAD 소프트웨어에서 도면을 원점에 가깝게 이동하거나, 단위가 올바르게 설정되었는지 확인하세요.',
                progress: {
                    uploading: '업로드 중'
                },
                backend_connect_failed_ask_to_upload: '#802 백엔드에 연결하려는 중 오류가 계속 발생합니다. 버그 리포트 로그를 업로드 하시겠습니까?',
                pdf2svg: {
                    error_when_converting_pdf: '#824 PDF를 SVG로 변환하는 중 오류가 발생했습니다.',
                    error_pdf2svg_not_found: '#825 오류: pdf2svg 명령어를 찾을 수 없습니다. 패키지 매니저를 이용하여 pdf2svg를 설치해주세요. (예: "yum install pdf2svg" 또는 "apt-get install pdf2svg")',
                },
                ungroup_use: '이 작업은 가져온 DXF 또는 SVG를 언그룹화합니다. 파일이 많은 요소를 포함하고 있기 때문에 시간이 걸릴 수 있습니다. 계속 진행하시겠습니까?',
                vectorize_shading_image: '그라데이션 이미지는 추적하는 데 시간이 더 오래 걸리며, 잡음이 발생하기 쉽습니다. 실행하기 전에 이미지 그라데이션을 꺼주세요.',
            },
            zoom_block: {
                fit_to_window: '화면에 맞게 조정',
            },
            left_panel: {
                insert_object: '개체 삽입',
                preview: '미리보기',
                borderless: '(국경 없는)',
                advanced: '고급',
                image_trace: '트레이스 이미지',
                suggest_calibrate_camera_first: 'Please calibrate the camera when using the machine for the first time. (Menu > Machine > [Your Machine] > Calibrate Camera) And refocus the platform properly every time before preview to get a better preview result.',
                end_preview: '미리보기 모드 종료',
                unpreviewable_area: '블라인드 영역',
                diode_blind_area: 'Hybrid Laser 추가 기능 블라인드 영역',
                borderless_blind_area: '비조각 영역',
                borderless_preview: '보더리스 모드 카메라 미리보기',
                rectangle: '사각형',
                ellipse: '타원',
                line: '선',
                image: '이미지',
                text: '텍스트',
                label: {
                    cursor: '선택',
                    photo: '이미지',
                    text: '텍스트',
                    line: '선',
                    rect: '사각형',
                    oval: '타원',
                    polygon: '다각형',
                    pen: '펜',
                    array: '어레이',
                    preview: '카메라 미리보기',
                    trace: '이미지 추적',
                    clear_preview: '미리보기 지우기'
                },
                insert_object_submenu: {
                    rectangle: '사각형',
                    ellipse: '타원',
                    line: '선',
                    image: '이미지',
                    text: '텍스트',
                    path: '경로',
                    polygon: '다각형'
                },
            },
            right_panel: {
                tabs: {
                    layers: '레이어',
                    objects: '개체',
                    path_edit: '경로 편집',
                },
                layer_panel: {
                    layer1: '레이어 1',
                    layer_bitmap: '비트맵',
                    layer_engraving: '조각',
                    layer_cutting: '절단',
                    move_elems_to: '요소 이동:',
                    notification: {
                        dupeLayerName: '해당 이름의 레이어가 이미 존재합니다!',
                        newName: '새 이름',
                        enterUniqueLayerName: '고유한 레이어 이름을 입력하세요.',
                        enterNewLayerName: '새 레이어 이름을 입력하세요.',
                        layerHasThatName: '해당 이름의 레이어가 이미 존재합니다.',
                        QmoveElemsToLayer: '선택한 요소를 \'%s\' 레이어로 이동하시겠습니까?',
                    },
                    layers: {
                        layer: '레이어',
                        layers: '레이어들',
                        del: '레이어 삭제',
                        move_down: '아래 레이어로 이동',
                        new: '새 레이어',
                        rename: '레이어 이름 바꾸기',
                        move_up: '위 레이어로 이동',
                        dupe: '레이어 복제',
                        lock: '레이어 잠금',
                        merge_down: '아래로 병합',
                        merge_all: '모두 병합',
                        move_elems_to: '요소 이동:',
                        move_selected: '선택한 요소를 다른 레이어로 이동하시겠습니까'
                    },
                },
                laser_panel: {
                    parameters: '파라미터',
                    strength: '파워',
                    speed: '스피드',
                    repeat: '실행',
                    focus_adjustment: '초점 조절',
                    height: '오브젝트 높이',
                    z_step: 'Z 스텝',
                    diode: '다이오드 레이저',
                    times: '회',
                    cut: '절단',
                    engrave: '새금',
                    more: '관리',
                    delete: '삭제',
                    reset: '리셋',
                    sure_to_reset: '이것은 모든 프리셋을 초기화하고 사용자 정의된 파라미터는 유지됩니다. 진행하시겠습니까?',
                    apply: '적용',
                    cancel: '취소',
                    save: '저장',
                    save_and_exit: '저장하고 종료',
                    name: '이름',
                    default: '기본값',
                    customized: '사용자 정의된 목록',
                    inuse: '사용 중',
                    export_config: '프리셋 내보내기',
                    new_config_name: '새 프리셋 이름',
                    sure_to_load_config: '이것은 프리셋 배열을 로드하고 파일에 설정된 사용자 지정 파라미터를 대체합니다. 진행하시겠습니까?',
                    dropdown: {
                        mm: {
                            wood_3mm_cutting: '목재 - 3mm 절단',
                            wood_5mm_cutting: '목재 - 5mm 절단',
                            wood_engraving: '목재 - 새금',
                            acrylic_3mm_cutting: '아크릴 - 3mm 절단',
                            acrylic_5mm_cutting: '아크릴 - 5mm 절단',
                            acrylic_engraving: '아크릴 - 새금',
                            leather_3mm_cutting: '가죽 - 3mm 절단',
                            leather_5mm_cutting: '가죽 - 5mm 절단',
                            leather_engraving: '가죽 - 새금',
                            fabric_3mm_cutting: '섬유 - 3mm 절단',
                            fabric_5mm_cutting: '섬유 - 5mm 절단',
                            fabric_engraving: '섬유 - 새금',
                            rubber_bw_engraving: '고무 - 새금',
                            glass_bw_engraving:  '유리 - 새금',
                            metal_bw_engraving: '금속 - 새금',
                            stainless_steel_bw_engraving_diode: '금속 - 새금 (다이오드 레이저)',
                            save: '현재 파라미터 추가',
                            export: '내보내기',
                            more: '관리',
                            parameters: '프리셋'
                        },
                        inches: {
                            wood_3mm_cutting: '목재 - 0.1\'\' 절단',
                            wood_5mm_cutting: '목재 - 0.2\'\' 절단',
                            wood_engraving: '목재 - 새금',
                            acrylic_3mm_cutting: '아크릴 - 0.1\'\' 절단',
                            acrylic_5mm_cutting: '아크릴 - 0.2\'\' 절단',
                            acrylic_engraving: '아크릴 - 새금',
                            leather_3mm_cutting: '가죽 - 0.1\'\' 절단',
                            leather_5mm_cutting: '가죽 - 0.2\'\' 절단',
                            leather_engraving: '가죽 - 새금',
                            fabric_3mm_cutting: '섬유 - 0.1\'\' 절단',
                            fabric_5mm_cutting: '섬유 - 0.2\'\' 절단',
                            fabric_engraving: '섬유 - 새금',
                            rubber_bw_engraving: '고무 - 새금',
                            glass_bw_engraving:  '유리 - 새금',
                            metal_bw_engraving: '금속 - 새금',
                            stainless_steel_bw_engraving_diode: '금속 - 새금 (다이오드 레이저)',
                            save: '현재 파라미터 추가',
                            export: '내보내기',
                            more: '관리',
                            parameters: '프리셋'
                        },
                    },
                    laser_speed: {
                        text: '레이저 속도',
                        unit: 'mm/s',
                        fast: '빠름',
                        slow: '느림',
                        min: 3,
                        max: 300,
                        step: 0.1
                    },
                    power: {
                        text: '전원',
                        high: '높음',
                        low: '낮음',
                        min: 1,
                        max: 100,
                        step: 0.1
                    },
                    para_in_use: '이 매개 변수가 사용 중입니다.',
                    do_not_adjust_default_para: '프리셋은 조정할 수 없습니다.',
                    existing_name: '이름이 이미 사용되었습니다.'
                },
                object_panel: {
                    zoom: '확대',
                    group: '그룹화',
                    ungroup: '그룹 해제',
                    hdist: '수평 분배',
                    vdist: '수직 분배',
                    left_align: '왼쪽 맞춤',
                    center_align: '가운데 맞춤',
                    right_align: '오른쪽 맞춤',
                    top_align: '상단 맞춤',
                    middle_align: '중앙 맞춤',
                    bottom_align: '하단 맞춤',
                    union: '합치기',
                    subtract: '빼기',
                    intersect: '교차',
                    difference: '차이',
                    hflip: '수평 반전',
                    vflip: '수직 반전',
                    option_panel: {
                        fill: '내부 채우기',
                        rounded_corner: '둥근 모서리',
                        font_family: '글꼴',
                        font_style: '스타일',
                        font_size: '크기',
                        letter_spacing: '자간',
                        line_spacing: '줄 간격',
                        vertical_text: '수직 텍스트',
                        shading: '그라데이션',
                        threshold: '임계 밝기',
                    },
                    actions_panel: {
                        replace_with: '다른 것으로 바꾸기...',
                        trace: '추적하기',
                        grading: '그레이딩',
                        sharpen: '선명하게',
                        crop: '자르기',
                        bevel: '경계선 처리',
                        invert: '반전',
                        convert_to_path: '경로로 변환',
                        wait_for_parsing_font: '글꼴 구문 분석 중... 잠시만 기다려주세요.',
                        offset: '오프셋',
                        array: '어레이',
                        decompose_path: '분해',
                        disassemble_use: '해체',
                        disassembling: '분해 중...',
                        ungrouping: '그룹해제...',
                    },
                    path_edit_panel: {
                        node_type: '노드 타입',
                    },
                },
            },
            bottom_right_panel: {
                convert_text_to_path_before_export: '텍스트를 패스로 변환...',
                retreive_image_data: '이미지 데이터 검색...',
                export_file_error_ask_for_upload: '작업 내보내기 실패. 버그 보고를 위해 작업 중인 씬을 개발팀에 제공할 의사가 있으신가요?',
            },
            image_trace_panel: {
                apply: '적용',
                back: '뒤로',
                cancel: '취소',
                next: '다음',
                brightness: '밝기',
                contrast: '대조',
                threshold: '임계값',
                okay: '확인',
                tuning: '매개변수'
            },
            photo_edit_panel: {
                apply: '적용',
                back: '뒤로',
                cancel: '취소',
                next: '다음',
                sharpen: '선명하게',
                sharpness: '선명도',
                crop: '자르기',
                curve: '곡선',
                start: '시작',
                processing: '처리중',
                invert: '색상 반전',
                okay: '확인',
                phote_edit: '사진 편집'
            },
            document_panel: {
                document_settings: '문서 설정',
                engrave_parameters: '새김 인쇄 매개변수',
                workarea: '작업 영역',
                rotary_mode: '로터리',
                borderless_mode: '열린 바닥',
                engrave_dpi: '해상도',
                enable_diode: '하이브리드 레이저',
                enable_autofocus: '오토포커스',
                add_on: '애드온',
                low: '낮음',
                medium: '보통',
                high: '높음',
                ultra: '최고',
                enable: '사용',
                disable: '비활성화',
                cancel: '취소',
                save: '저장'
            },
            object_panels: {
                position: '위치',
                rotation: '회전',
                size: '크기',
                width: '너비',
                height: '높이',
                center: '센터',
                ellipse_radius: '크기',
                rounded_corner: '둥근 모서리',
                radius: '반경',
                points: '포인트',
                length: '길이',
                text: '텍스트',
                font_size: '크기',
                fill: '채우기',
                letter_spacing: '문자 간격',
                line_spacing: '줄 간격',
                vertical_text: '세로 텍스트',
                convert_to_path: '경로로 변환',
                convert_to_path_to_get_precise_result: '일부 글꼴은 올바르게 구문 분석할 수 없습니다. 빔박스에 제출하기 전에 텍스트를 경로로 변환하세요.',
                wait_for_parsing_font: '글꼴 구문 분석 중... 잠시만 기다려주세요.',
                text_to_path: {
                    font_substitute_pop:'Text: "%s"에 현재 글꼴에서 지원하지 않는 아래 문자가 포함되어 있습니다: "%s".\n%s\n"%s"를 대체로 사용하시겠습니까?',
                    check_thumbnail_warning: '문자열을 패스로 변환하는 동안 일부 문자열이 다른 글꼴로 변경되어 일부 문자가 제대로 변환되지 않을 수 있습니다. 작업을 보내기 전 미리보기 이미지를 다시 확인해주세요.'
                },
                laser_config: '레이저 구성',
                shading: '음영',
                threshold: '임계값',
                lock_desc: '너비와 높이의 비율 유지하기 (SHIFT)'
            },
            tool_panels:{
                cancel: '취소',
                confirm: 'Con확인',
                grid_array: '격자형 배열 생성',
                array_dimension: '배열 크기',
                rows: '행',
                columns: '열.',
                array_interval: '배열 간격',
                dx: 'X',
                dy: 'Y',
                offset: '오프셋',
                nest: '배열 최적화',
                _offset: {
                    direction: '오프셋 방향',
                    inward: '내부',
                    outward: '외부',
                    dist: '오프셋 거리',
                    corner_type: '구석',
                    sharp: '뾰족한',
                    round: '둥근',
                    fail_message: '객체 오프셋 실패',
                    not_support_message: '이미지, 그룹, 텍스트 및 가져온 객체를 포함하는 선택한 요소가 지원되지 않는 SVG 태그를 포함하고 있습니다.\n&lt;image&gt;, &lt;g&gt;, &lt;text&gt;, &lt;use&gt;\n이러한 개체는 건너뜁니다.',
                },
                _nest: {
                    start_nest: '정렬',
                    stop_nest: '중지',
                    end: '닫기',
                    spacing: '간격',
                    rotations: '가능한 회전',
                    no_element: '정렬할 요소가 없습니다.',
                }
            },
            network_testing_panel: {
                network_testing: '네트워크 테스트',
                local_ip: '로컬 IP 주소:',
                insert_ip: '대상 장치 IP 주소:',
                empty_ip: '#818 대상 장치 IP 주소를 입력하세요.',
                start: '시작',
                end: '종료',
                testing: '네트워크 테스트 중...',
                invalid_ip: '#818 잘못된 IP 주소입니다.',
                network_healthiness: '네트워크 건강성',
                average_response: '평균 응답 시간',
                test_completed: '테스트 완료',
                test_fail: '테스트 실패',
                cannot_connect_1: '#840 대상 IP에 연결하지 못했습니다.',
                cannot_connect_2: '#840 대상이 동일한 네트워크에 있는지 확인하십시오.',
                cannot_get_local: '로컬 IP 주소에 액세스할 수 없습니다.',
                fail_to_start_network_test: '#817 네트워크 테스트 시작 실패.'
            },
            layer_color_config_panel: {
                layer_color_config: '레이어 색상 구성',
                color: '색깔',
                power: '파워',
                speed: '속도',
                repeat: '실행',
                add: '추가',
                save: '저장',
                cancel: '취소',
                default: '기본값으로 재설정',
                add_config: '색상 추가',
                in_use: '이 색상을 사용 중입니다.',
                no_input: '유효한 16진수 색상 코드를 입력하십시오.',
                sure_to_reset: '모든 사용자 정의 매개변수가 삭제됩니다. 기본값으로 재설정하시겠습니까?',
                sure_to_delete: '이 색상 설정을 삭제하시겠습니까?'
            },
            svg_editor: {
                unnsupported_file_type: '해당 파일 유형은 직접 지원되지 않습니다. 파일을 SVG 또는 비트맵으로 변환하십시오.',
                unnsupport_ai_file_directly: '먼저 AI 파일을 SVG 또는 비트맵으로 변환하세요.',
                unable_to_fetch_clipboard_img: '클립보드에서 이미지를 가져오지 못했습니다.',
            },
            units: {
                walt: 'W',
                mm: 'mm'
            }
        },
        select_printer: {
            choose_printer: '머신 선택',
            notification: '"%s"에는 암호가 필요합니다.',
            submit: '제출',
            please_enter_password: '비밀번호',
            auth_failure: '#811 인증 실패',
            retry: '다시 시도',
            unable_to_connect: '#810 기기와 안정적인 연결을 구축할 수 없습니다.'
        },
        device: {
            pause: '일시 정지',
            paused: '일시 정지됨',
            pausing: '일시 정지 중',
            select_printer: '프린터 선택',
            retry: '재시도',
            status: '상태',
            busy: '사용 중',
            ready: '준비됨',
            reset: '초기화 (Kick)',
            abort: '중단',
            start: '시작',
            please_wait: '잠시 기다려주세요...',
            quit: '취소',
            heating: '난방',
            completing: '완료 중',
            aborted: '중단됨',
            completed: '완료됨',
            calibrating: '보정하기',
            showOutline: '프레임 표시',
            aborting: '중단 중',
            starting: '시작 중',
            preparing: '준비 중',
            resuming: '다시 시작 중',
            scanning: '스캔 중',
            occupied: '유지보수 중',
            running: '작업 중',
            uploading: '업로드 중',
            processing: '처리 중',
            disconnectedError: {
                caption: '기계 연결 끊김',
                message: '%s의 네트워크 접속이 가능한지 확인해주세요.'
            },
            noTask: '현재 수행할 작업이 없습니다.',
            pleaseWait: '잠시만요...',
            finishing: '마무리',
            initiating: '시작',
            unknown: '알 수 없음',
            pausedFromError: '오류로 인한 일시정지',
            model_name: '모델명',
            IP: 'IP',
            serial_number: '일련 번호',
            firmware_version: '펌웨어 버전',
            UUID: 'UUID',
            select: '선택',
            deviceList: '기계 목록',
            calibration: {
                title: '자동 보정',
                A: '레벨링 및 높이',
                H: '높이만',
                N: '꺼짐',
                byFile: '파일별'
            },
            detectFilament: {
                title: '필라멘트 감지',
                on: '켜기',
                off: '꺼짐',
                byFile: '파일별'
            },
            filterHeadError: {
                title: '툴헤드 오류 감지',
                shake: '흔들기',
                tilt: '기울기',
                fan_failure: '팬 고장',
                laser_down: '레이저 인터록',
                byFile: '파일 기준',
                no: '아니요'
            },
            autoresume: {
                title: '스마트한 작업 연속',
                on: '켜기',
                off: '꺼짐'
            },
            broadcast: {
                title: 'UPNP 방송',
                L: '기본값',
                A: '활성',
                N: '아니요'
            },
            enableCloud: {
                title: '클라우드 사용',
                A: '활성',
                N: '아니요'
            },
            backlash: '기하학적 오류 보정',
            turn_on_head_temperature: '공구 헤드 온도 설정',
            plus_camera: '업그레이드 키트 카메라',
            plus_extrusion: '압출기 업그레이드 키트',
            postback_url: '상태 콜백 URL',
            movement_test: '인쇄 전 움직임 테스트',
            machine_radius: 'Delta 반경',
            disable: '비활성화',
            enable: '활성화',
            beambox_should_use_touch_panel_to_adjust: '빔박스 설정은 빔박스 터치 패널에서 조정해야 합니다.'
        },
        monitor: {
            change_filament                     : '필라멘트 변경',
            browse_file                         : '파일 찾아보기',
            monitor                             : 'MONITOR',
            currentTemperature                  : '현재 온도',
            nothingToPrint                      : '인쇄할 항목이 없습니다',
            go                                  : 'Go',
            start                               : '시작',
            pause                               : '일시 정지',
            stop                                : '정지',
            record                              : '녹화',
            camera                              : '카메라',
            connecting                          : '연결 중입니다. 기다려주세요...',
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
            HARDWARE_ERROR_MAINBOARD_ERROR      : '#401 치명적인 오류: 메인보드 오프라인. FLUX 지원팀에 문의하세요.',
            HARDWARE_ERROR_SUBSYSTEM_ERROR      : '#402 치명적인 오류: 하위 시스템 응답 없음. FLUX 지원팀에 문의하세요.',
            HARDWARE_ERROR_SENSOR_ERROR         : '하드웨어 센서 오류는 FLUX 지원팀에 문의하세요.',
            HARDWARE_ERROR_SENSOR_ERROR_FSR     : '압력 센서 실패',
            HARDWARE_ERROR_PUMP_ERROR           : '#900 워터탱크를 확인해주세요.',
            HARDWARE_ERROR_DOOR_OPENED          : '#901 계속하려면 문을 닫으세요.',
            HARDWARE_ERROR_OVER_TEMPERATURE     : '#902 과열되었습니다. 몇 분 기다려주세요.',
            USER_OPERATION_ROTARY_PAUSE         : '로터리 모터로 전환하세요',
            WRONG_HEAD                          : '툴헤드를 알 수 없습니다. 올바른 툴헤드에 연결하세요.',
            USER_OPERATION                      : '(다른) 사용자가 기기를 작동 중입니다.',
            RESOURCE_BUSY                       : '기계가 작동 중입니다. 작동하지 않으면 기계를 다시 시작하세요.',
            DEVICE_ERROR                        : '문제가 발생했습니다. 기계를 다시 시작하세요.',
            NO_RESPONSE                         : '문제가 발생했습니다. 기계를 다시 시작하세요.',
            SUBSYSTEM_ERROR                     : '#402 치명적인 오류: 하위 시스템 응답 없음. FLUX 지원팀에 문의하세요.',
            HARDWARE_FAILURE                    : '문제가 발생했습니다. 기계를 다시 시작하세요.',
            MAINBOARD_OFFLINE                   : '문제가 발생했습니다. 기계를 다시 시작하세요.',
            G28_FAILED                          : '#124 Unable to calibrate origin (home)\nPlease remove obstacles on rails, and make sure toolhead cables are not caught by carriages.',
            FILAMENT_RUNOUT_0                   : '#121 Ran out of filament\nPlease insert new material <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218931757">More Info</a>',
            USER_OPERATION_FROM_CODE            : '작동을 위해 일시 중지됨(필라멘트 변경)',
            processing                          : '처리 중',
            savingPreview                       : '섬네일 생성 중',
            hour                                : '시',
            minute                              : '분',
            second                              : '초',
            left                                : '남음',
            temperature                         : '온도',
            forceStop                           : '현재 작업을 중단하시겠습니까?',
            upload                              : '업로드',
            download                            : '다운로드',
            relocate                            : '이동',
            cancel                              : '취소',
            prepareRelocate                     : '이동 준비 중',
            fileNotDownloadable                 : '이 파일 형식은 지원되지 않습니다',
            cannotPreview                       : '이 파일 형식을 미리 볼 수 없습니다',
            extensionNotSupported               : '이 파일 형식은 지원되지 않습니다',
            fileExistContinue                   : '파일이 이미 있습니다. 대체하시겠습니까?',
            confirmGToF                         : 'GCode가 FCode로 변환됩니다. 계속하시겠습니까? (존재하면 대체합니다)',
            updatePrintPresetSetting            : 'FLUX Studio에 새로운 기본 인쇄 매개변수가 있습니다. 업데이트하시겠습니까? \n( 현재 설정을 덮어씁니다.)',
            confirmFileDelete                   : '이 파일을 삭제하시겠습니까?',
            task: {
                EXTRUDER                        : '인쇄',
                PRINT                           : '인쇄',
                LASER                           : '레이저 인그레이빙',
                DRAW                            : '디지털 드로잉',
                CUT                             : '비닐 커팅',
                VINYL                           : '비닐 커팅',
                BEAMBOX                         : '레이저 인그레이빙',
                'N/A'                           : '무료 모드'
            },
            device: {
                EXTRUDER                        : '인쇄 툴헤드',
                LASER                           : '인그레이빙 툴헤드',
                DRAW                            : '그리기 도구헤드'
            },
            cant_get_toolhead_version           : '도구 헤드 정보를 가져올 수 없음'
        },
        alert: {
            caption: '오류',
            duplicated_preset_name: '중복된 프리셋 이름',
            info: '정보',
            warning: '경고',
            error: 'UH-OH',
            oops: 'Oops...',
            retry: '다시 시도',
            abort: '중단',
            confirm: '확인',
            cancel: '취소',
            close: '닫기',
            ok: 'OK',
            ok2: 'OK',
            yes: '예',
            no: '아니요',
            stop: '중지',
            save: '저장',
            dont_save: '저장하지 않음'
        },
        caption: {
            connectionTimeout: '연결 시간 초과'
        },
        message: {
            connecting: '연결 중...',
            connectingMachine: '%s 연결 중...',
            tryingToConenctMachine: '기계에 연결을 시도 중입니다...',
            connected: '연결됨',
            authenticating: '인증 중...',
            runningTests: '테스트 실행 중...',
            machineNotConnected: '기기가 연결되지 않았습니다',
            notPrinting: '인쇄가 진행 중이 아닙니다',
            nothingToPrint: '인쇄할 항목 없음(소스 블롭 누락)',
            connectionTimeout: '#805 기기 연결 시간 초과. 네트워크 상태와 기기의 Wi-Fi 표시기를 확인해주세요.',
            device_not_found: {
                caption: '기본 기기를 찾을 수 없습니다',
                message: '#812 기기의 Wi-Fi 표시기를 확인해주세요.'
            },
            device_busy: {
                caption: '기계가 바쁩니다',
                message: '기계가 다른 작업을 실행 중입니다. 나중에 다시 시도해보세요. 만약 기계가 작동을 멈춘다면, 기계를 다시 시작하세요.'
            },
            device_is_used: '기계가 사용 중입니다. 현재 작업을 중단하시겠습니까?',
            device_in_use: '기기를 사용 중입니다. 현재 작업을 중지하거나 일시 중지해 주세요.',
            invalidFile: '파일이 유효한 STL 파일이 아닙니다.',
            failGeneratingPreview: '미리 보기 생성 실패',
            slicingFailed: 'slic3r이 이 모델을 슬라이스할 수 없습니다.',
            no_password: {
                content: '이 컴퓨터에 연결할 수 있도록 USB를 통해 컴퓨터 비밀번호를 설정합니다.',
                caption: '비밀번호 미설정'
            },
            image_is_too_small: '파일에 지원되지 않는 정보가 포함되어 있습니다.',
            monitor_too_old: {
                caption: '펌웨어가 오래되었습니다',
                content: '#814 <a target="_blank" href="http://helpcenter.flux3dp.com/hc/en-us/articles/216251077">이 가이드</a>를 따라 최신 펌웨어를 설치해주세요.'
            },
            cant_establish_connection: 'Unable to connect FLUX Studio API.<a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/requests/new" target="_blank">FLUX</a>지원팀에 문의하세요.',
            application_occurs_error: '애플리케이션에 처리되지 않은 오류가 발생했습니다.',
            error_log: '오류 로그',
            fcodeForLaser: '인그레이빙용 FCode입니다.',
            fcodeForPen: '드로잉용 FCode 입니다.',
            confirmFCodeImport: 'FCode를 임포트하면 씬의 모든 오브젝트가 제거되나요?',
            confirmSceneImport: '.fsc를 임포트하면 씬의 모든 오브젝트가 제거되나요?',
            brokenFcode: '%s열 수 없음 ',
            slicingFatalError: '슬라이싱하는 동안 오류가 발생했습니다. STL 파일을 고객 지원팀에 신고해 주세요.',
            unknown_error: '#821 알 수 없는 오류가 발생했습니다. 도움말 > 메뉴 > 버그 보고서를 사용해주세요.',
            unknown_device: '#826 기계에 연결할 수 없습니다. USB가 기계에 연결되어 있는지 확인해주세요.',
            important_update: {
                caption: '중요 업데이트',
                message: '중요 머신 펌웨어 업데이트를 사용할 수 있습니다. 지금 업데이트하시겠습니까?',
            },
            unsupport_osx_version: '현재 MacOS 버전 X %s에서는 일부 기능을 지원하지 않을 수 있습니다. 최신 버전으로 업데이트해주세요.',
            unsupport_win_version: '현재 OS 버전 %s에서는 일부 기능을 지원하지 않을 수 있습니다. 최신 버전으로 업데이트해주세요.',
            need_password: '기계에 연결하려면 비밀번호가 필요합니다',
            unavailableWorkarea: '#804 현재 작업 영역이 이 기계의 작업 영역을 초과합니다. 선택한 기계의 작업 영역을 확인하거나 편집 > 문서 설정에서 작업 영역을 설정해주세요.',
            new_app_downloading: 'FLUX Studio 다운로드 중',
            new_app_download_canceled: 'FLUX Studio 다운로드가 취소되었습니다.',
            new_app_downloaded: '최신 FLUX Studio가 다운로드되었습니다.',
            ask_for_upgrade: '지금 업그레이드하시겠습니까?',
            please_enter_dpi: '파일의 단위를 입력해주세요 (mm)',
            auth_error: '#820 인증 오류: Beam Studio와 기계 펌웨어를 최신 버전으로 업데이트해주세요.',
            gcode_area_too_big: '가져온 GCode가 인쇄 가능한 영역을 초과합니다.',
            empty_file: '파일이 비어 있습니다.',
            usb_unplugged: 'USB 연결이 끊어졌습니다. USB 연결을 확인해주세요.',
            launghing_from_installer_warning: '인스톨러에서 FLUX Studio를 실행하고 있으며 이로 인해 문제가 발생할 수 있습니다. FLUX Studio를 애플리케이션 폴더로 이동하세요.',
            uploading_fcode: 'FCode 업로드',
            cant_connect_to_device: '#827 기기에 연결할 수 없습니다. 연결을 확인해주세요.',
            unable_to_find_machine: '기계를 찾을 수 없습니다',
            unable_to_start: '#830 작업을 시작할 수 없습니다. 다시 시도해주세요. 이 오류가 계속 발생하면 버그 보고서를 제출해주세요:',
            camera_fail_to_transmit_image: '이미지 전송에 문제가 발생했습니다. 빔박스를 다시 시작하거나 당사에 문의해 주세요.'
        },
        machine_status: {
            '-10': '유지 관리 모드',
            '-2': '스캔',
            '-1': '유지 관리',
            0: '대기',
            1: '시작 중',
            2: 'ST_TRANSFORM',
            4: '시작',
            6: '재개',
            16: '작업 중',
            18: '재개',
            32: '일시 정지',
            36: '일시 정지',
            38: '일시 정지',
            48: '일시 정지',
            50: '일시 정지',
            64: '완료됨',
            66: '완료 중',
            68: '준비 중',
            128: '중단됨',
            UNKNOWN: '미상'
        },
        head_module: {
            EXTRUDER: '인쇄',
            LASER: '레이저',
            UNKNOWN: '',
            error: {
                'missing': '오류 정보가 누락되었습니다',
                '0': '알 수 없는 모듈',
                '1': '센서 통신 오류',
                '2': 'No hello', // pi will send head_error_reset before this is issued
                '3': '#112 공구 헤드의 내부 자이로 보정할 수 없음\n공구 헤드를 다시 부착하십시오.',
                '4': '#162 공구 헤드 기울기가 감지되었습니다\n볼 조인트 로드가 올바르게 부착되었는지 확인하십시오.',
                '5': '#162 공구 헤드 기울기가 감지되었습니다\n볼 조인트 로드가 올바르게 부착되었는지 확인하십시오.',
                '6': '#119 프린터 툴헤드가 온도를 제어할 수 없습니다. FLUX Support 에 문의하세요.',
                '7': '#113 냉각 팬이 고장났습니다\n연필이나 얇은 막대기로 팬을 돌리세요. <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/217732178">자세한 정보</a>',
                '8': '#116 조각 도구 헤드 기울기가 감지됨\n로드가 올바르게 연결되어 있는지 확인하십시오. <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/217085937">자세한 정보</a>',
                '9': '#118 프린터 툴헤드를 가열할 수 없습니다\nFLUX Support에 문의하세요.'
            }
        },
        change_filament: {
            home_caption: '필라멘트 변경',
            load_filament_caption: '로드',
            load_flexible_filament_caption: '유연한 로드',
            unload_filament_caption: '언로드',
            cancel: '취소',
            load_filament: '필라멘트 로드',
            load_flexible_filament: '플렉시블 필라멘트 로드',
            unload_filament: '필라멘트 언로드',
            next: '다음',
            heating_nozzle: '가열 노즐',
            unloading: 'Unloading Filament',
            loaded: '필라멘트 언로드',
            unloaded: '필라멘트 언로드',
            ok: 'OK',
            kicked: '쫓겨났음',
            auto_emerging: '필라멘트를 삽입하세요.',
            loading_filament: '필라멘트 로딩',
            maintain_head_type_error: '공구 헤드가 올바르게 설치되지 않았습니다.',
            disconnected: '연결이 불안정합니다. 장치 연결을 확인하고 나중에 다시 시도하세요.',
            maintain_zombie: '컴퓨터를 다시 시작하세요.',
            toolhead_no_response: '#117 모듈 응답 없음 <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218347477">자세히 보기</a>',
            NA: '공구 헤드가 연결되지 않았습니다.'
        },
        head_temperature: {
            title: '공구 헤드 온도 설정',
            done: '마침',
            target_temperature: '목표 온도',
            current_temperature: '현재 온도',
            set: '설정',
            incorrect_toolhead: '잘못된 툴헤드, 인쇄용 툴헤드를 사용하세요.',
            attach_toolhead: '인쇄 툴헤드를 연결하세요.'
        },
        camera_calibration: {
            update_firmware_msg1: '당신의 펌웨어는 이 기능을 지원하지 않습니다. 계속하려면 최신 펌웨어 버전으로 업데이트하십시오.',
            update_firmware_msg2: '(메뉴> 기계> [당신의 기계]> 펌웨어 업데이트)',
            camera_calibration: '카메라 보정',
            next: '다음',
            cancel: '취소',
            back: '뒤로',
            finish: '완료',
            please_goto_beambox_first: '이 기능을 사용하려면 Engraving Mode (Beambox)로 전환하십시오.',
            please_place_paper: {
                beambox: '좌측 상단 모서리에 A4 또는 Letter 크기의 흰색 종이를 놓으십시오.',
                beamo: '좌측 상단 모서리에 A4 또는 Letter 크기의 흰색 종이를 놓으십시오.',
            },
            please_refocus: {
                beambox: '대상물의 초점 (뒤집힌 아크릴의 높이)에 대한 플랫폼을 조정하십시오.',
                beamo: '레이저 헤드를 각인 대상물 (뒤집힌 아크릴의 높이)에 맞추십시오.'
            },
            dx: 'X',
            dy: 'Y',
            rotation_angle: '회전',
            x_ratio: 'X 비율',
            y_ratio: 'Y 비율',
            show_last_config: '마지막 결과 표시',
            hide_last_config: '마지막 결과 숨기기',
            taking_picture: '사진 찍는 중...',
            start_engrave: '인쇄 시작',
            analyze_result_fail: '캡처 된 이미지를 분석하지 못했습니다. <br/>확인해주세요:<br/>1. 촬영된 사진이 완전히 흰 종이로 덮여 있는지 확인하십시오.<br/>2. 플랫폼이 적절하게 초점이 맞춰졌는지 확인하십시오.',
            no_lines_detected: '캡처한 이미지에서 선을 감지하지 못했습니다.<br/>확인해 주세요:<br/>1. 캡처한 사진이 흰 종이로 완전히 덮여 있는지 <br/>2. 플랫폼에 초점이 제대로 맞춰져 있는지 확인하세요.',
            drawing_calibration_image: '보정 이미지 그리는 중...',
            please_confirm_image: '<div><div class="img-center" style="background:url(%s)"></div></div>다음 사항을 확인하세요.<br/>1. 캡처한 사진이 흰색 종이로 완전히 덮여 있는지.<br/>2. 플랫폼에 초점이 제대로 맞춰져 있는지.',
            calibrate_done: '보정 완료. 초점을 정확하게 맞추면 카메라의 정확도가 향상됩니다.',
            hint_red_square: '빨간색 정사각형을 잘라낸 정사각형에 맞춰주세요.',
            hint_adjust_parameters: '다음 매개 변수를 사용하여 빨간색 사각형을 조정합니다.'
        },
        diode_calibration: {
            update_firmware_msg1: '당신의 펌웨어는이 기능을 지원하지 않습니다. 계속하려면 최신 펌웨어 버전으로 업데이트하십시오.',
            update_firmware_msg2: '(메뉴> 기기> [당신의 기기]> 펌웨어 업데이트)',
            diode_calibration: '하이브리드 레이저 모듈 캘리브레이션',
            next: '다음',
            cancel: '취소',
            back: '뒤로',
            start_engrave: '인쇄 시작',
            finish: '완료',
            please_do_camera_calibration_and_focus: {
                beambox: '하이브리드 레이저 모듈을 캘리브레이션할 때는 카메라가 필요합니다.이 기계의 카메라가 보정되었는지 확인하십시오.그리고 플랫폼을 초점(아래로 향한 아크릴의 높이)에 맞게 조정하세요.',
                beamo: '하이브리드 레이저 모듈을 보정할 때는 카메라가 필요합니다.\n이 기계의 카메라가 보정되었는지 확인하고 레이저 헤드가 조각 대상(아래로 향한 아크릴의 높이)에 초점을 맞추도록 친절하게 조정하십시오.'
            },
            please_place_paper: {
                beambox: 'A4 또는 Letter 크기의 흰 종이를 작업 영역의 좌측 상단에 놓으세요.',
                beamo: 'A4 또는 Letter 크기의 흰 종이를 작업 영역의 좌측 상단에 놓으세요.',
            },
            dx: 'X',
            dy: 'Y',
            drawing_calibration_image: '보정 이미지 그리는 중...',
            taking_picture: '사진 찍는 중...',
            calibrate_done: '보정 완료. 다이오드 레이저 모듈의 오프셋이 저장되었습니다.',
            hint_red_square: '빨간 정사각형의 외곽을 잘 맞춰주세요.',
            hint_adjust_parameters: '빨간 정사각형을 조정하는 데 이 매개 변수를 사용하세요.'
        },
        input_machine_password: {
            require_password: '"%s"은(는) 비밀번호가 필요합니다.',
            connect: '연결',
            password: '비밀번호'
        },
        set_default: {
            success: '%s를 기본값으로 성공적으로 설정했습니다.',
            error: '네트워크 문제로 인해 %s를 기본값으로 설정할 수 없습니다.'
        },
        tutorial: {
            set_first_default_caption: '환영합니다',
            set_first_default: '"%s"를 기본 장치로 설정하시겠습니까?',
            startWithFilament: '이제 필라멘트를 로드하겠습니다.',
            startWithModel: '다음으로 예제 3D 모델을 임포트해 보겠습니다.',
            startTour: '환영합니다!<br/>인쇄가 처음이신데요,<br/>인쇄 튜토리얼을 시작하시겠습니까?',
            clickToImport: '3D 모델 예제를 가져오려면 여기를 클릭하세요.',
            selectQuality: '원하는 화질 선택',
            clickGo: '인쇄 준비',
            startPrint: '격자가 없는 접시에 접착제를 바르고 마를 때까지 기다리면 인쇄할 준비가 된 것입니다.',
            skip: '건너뛰기',
            startPrintDeltaPlus: '마그네틱 인쇄판을 부착해야 합니다.',
            runningMovementTests: '동작 테스트 실행',
            connectingMachine: '머신에 연결하기',
            movementTestFailed: { caption: '움직임 테스트를 통과할 수 없음',  message: '1. 공구 헤드 케이블이 올바르게 늘어났는지 확인합니다.<br/>2. 기계에 연결된 공구 헤드 케이블의 커넥터가 기계에 절반 정도 삽입되었는지 확인합니다.<br/>3. 인쇄 도구 헤드의 커넥터를 180도 돌려보십시오.<br/>4. 확인 <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/115003674128">이 문서</a>.<br/> 다시 시도하시겠습니까?' },
            befaultTutorialWelcome: 'FLUX Delta+를 주문해 주셔서 감사합니다!<br/><br/> 이 가이드는 머신의 기본 설정을 안내하고 설정하는 데 도움이 됩니다.<br/><br/> 튜토리얼을 시청해 보세요! 자막을 켜주세요.<br/><br/>',
            openBrowser: '오픈 브라우저',
            welcome: '환영',
            needNewUserTutorial: '튜토리얼을 시작합니다.',
            needNewInterfaceTutorial: '빔 스튜디오의 새로운 인터페이스에 대한 튜토리얼을 시작합니다.',
            next: '다음',
            look_for_machine: '튜토리얼용 머신을 찾고 있습니다...',
            unable_to_find_machine: '튜토리얼에 사용할 컴퓨터를 찾을 수 없습니다. 연결 설정 페이지로 이동하여 다시 시도하거나 튜토리얼을 건너뛰시겠습니까?',
            skip_tutorial: '튜토리얼을 건너뛰었습니다. "도움말" > "튜토리얼 시작 표시"를 클릭하여 언제든지 튜토리얼을 시작할 수 있습니다.',
            set_connection: '연결 설정',
            retry: '다시 시도',
            newUser: {
                draw_a_circle: '원 그리기',
                drag_to_draw: '드래그하여 그리기',
                infill: '채우기 켜기',
                switch_to_layer_panel: '레이어 패널로 전환',
                set_preset_wood_engraving: '프리셋 설정: 목재 - 인그레이빙',
                set_preset_wood_cut: '프리셋 설정: 목재 - 절단',
                add_new_layer: '새 레이어 추가',
                draw_a_rect: '직사각형 그리기',
                switch_to_preview_mode: '미리보기 모드로 전환',
                preview_the_platform: '플랫폼 미리 보기',
                put_wood: '1. 샘플 목재 넣기',
                adjust_focus: '2. 초점 조정하기',
                close_cover: '3. 덮개 닫기',
                send_the_file: '파일 보내기',
                end_alert: '튜토리얼을 정말 끝내시겠습니까?',
                please_select_wood_engraving: '"나무 - 인그레이빙" 프리셋을 선택하세요.',
                please_select_wood_cutting: '"목재 - 자르기" 프리셋을 선택하세요.',
            },
            newInterface: {
                camera_preview: '카메라 미리보기',
                select_image_text: '선택 / 이미지 / 텍스트',
                basic_shapes: '기본 도형',
                pen_tool: '펜 도구',
                add_new_layer: '새 레이어 추가',
                rename_by_double_click: '더블 클릭하여 이름 바꾸기',
                drag_to_sort: '드래그하여 정렬',
                layer_controls: '레이어 제어를 선택하려면 마우스 오른쪽 버튼을 클릭하세요: 레이어 복제 / 병합 / 잠금 / 레이어 삭제',
                switch_between_layer_panel_and_object_panel: '레이어 패널과 객체 패널 사이 전환',
                align_controls: '정렬 제어',
                group_controls: '그룹 제어',
                shape_operation: '도형 조작',
                flip: '뒤집기',
                object_actions: '객체 동작',
                end_alert: '새 UI 소개를 종료하시겠습니까?',
            },
            links: {
                adjust_focus_bm: 'https://flux3dp.zendesk.com/hc/en-us/articles/360001684196',
                adjust_focus_bb: ' https://support.flux3dp.com/hc/en-us/articles/360001683675-Adjusting-the-focus',
            },
            tutorial_complete: '튜토리얼은 여기까지입니다. 이제 창작의 시간입니다!',
        },
        slicer: {
            computing: '컴퓨팅',
            error: {
                '6': '계산된 공구 경로가 작업 영역을 벗어났습니다. 물체의 크기를 줄이거나 뗏목, 테두리 또는 스커트를 끄십시오.',
                '7': '고급 매개 변수를 설정하는 동안 오류가 발생했습니다.',
                '8': '슬라이싱:: API가 빈 결과를 반환했습니다.\n슬라이싱이 완료되기 전에 결과 요청이 호출되었을 수 있습니다.',
                '9': '슬라이싱:: API가 빈 경로를 반환했습니다.\n슬라이싱 완료 전에 도구 경로 요청이 호출되었을 수 있습니다.',
                '10': '슬라이싱:: 누락된 개체 데이터입니다. 슬라이서 엔진에서 소스 오브젝트가 누락되었습니다.',
                '13': '슬라이싱:: 중복 오류\n선택한 ID가 존재하지 않습니다. FLUX Studio를 재시작해도 오류가 해결되지 않으면 이 오류를 신고해 주세요.',
                '14': '슬라이싱:: 위치를 설정하는 동안 오류가 발생했습니다. 슬라이서 엔진에 소스 오브젝트가 없습니다.',
                '15': '슬라이싱:: 업로드한 파일이 손상되었습니다. 파일을 확인한 후 다시 시도하세요.',
                '16': '슬라이싱:: 슬라이싱 엔진이 비정상적으로 종료되었으니 다시 슬라이싱해 주세요.',
                '1006': 'WS가 예기치 않게 종료된 경우 도움말 메뉴에서 버그 보고서를 받아 저희에게 보내주세요.'
            },
            pattern_not_supported_at_100_percent_infill: 'Slic3r은 직선 인필 패턴으로 100% 인필만 지원합니다.'
        },
        calibration: {
            RESOURCE_BUSY: '기기가 유휴 상태인지 확인하세요.',
            headMissing: '헤드 모듈 정보를 검색할 수 없습니다. 헤드 모듈이 연결되어 있는지 확인하세요.',
            calibrated: '자동 레벨링 완료',
            extruderOnly: '인쇄 도구 헤드를 사용하여 보정하십시오.'
        },
        head_info: {
            ID                  : 'ID',
            VERSION             : '펌웨어 버전',
            HEAD_MODULE         : '툴헤드 유형',
            EXTRUDER            : '인쇄 툴헤드',
            LASER               : '인그레이빙 툴헤드',
            USED                : '사용됨',
            HARDWARE_VERSION    : '하드웨어 버전',
            FOCAL_LENGTH        : '초점 거리',
            hours               : '시간',
            cannot_get_info     : '도구 헤드 유형을 읽을 수 없습니다'
        }
    };
});
