define(function() {
    'use strict';

    return {
        general: {
            wait: '処理中です、お待ちください'
        },
        buttons: {
            next: '次へ'
        },
        topbar: {
            untitled: '無題',
            titles: {
                settings: '環境設定'
            },
            zoom: 'ズーム',
            group: 'グループ化',
            ungroup: '解除',
            halign: '水平配置',
            valign: '垂直配置',
            hdist: '左右に整列',
            vdist: '上下に整列',
            left_align: '左',
            center_align: '中央',
            right_align: '右',
            top_align: '上部',
            middle_align: '中間',
            bottom_align: '下部',
            union: 'ユニオン',
            subtract: '引く',
            intersect: '交差',
            difference: '差',
            hflip: '左右反転',
            vflip: '上下反転',
            export: 'ゴー',
            preview: 'プレビュー',
            borderless: '（ボーダーレス）',
            tag_names: {
                rect: '矩形',
                ellipse: '楕円',
                path: 'パス',
                polygon: 'ポリゴン',
                image: 'イメージ',
                text: 'テキスト',
                line: 'ライン',
                g: 'グループ',
                multi_select: '複数選択',
                use: 'インポートされたファイル',
                svg: 'インポートされた svg',
                dxf: 'インポートされた dxf',
            },
            alerts: {
                start_preview_timeout: '#803 プレビューモードの開始時にタイムアウトが発生しました。マシンまたはBeam Studioを再起動してください。このエラーが続く場合は、この<a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/360001111355">ガイド</a>に従ってください。',
                fail_to_start_preview: '#803 プレビューモードを開始できません。マシンまたはBeam Studioを再起動してください。このエラーが続く場合は、この<a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/360001111355">ガイド</a>に従ってください。',
            }
        },
        support: {
            no_webgl: 'WebGLはサポートされていません。他のデバイスを使用してください。',
            no_vcredist: '「Visual C++ Redistributable 2015」をインストールしてください。<br/>それはflux3dp.comでダウンロードできます',
            osx_10_9: 'OS X 10.9はサポートされていません。新しいバージョンにアップデートしてください'
        },
        generic_error: {
            UNKNOWN_ERROR: '[UE] FLUX Studioを再起動してください',
            OPERATION_ERROR: '[OE] ステータスの競合が発生しました。アクションを再試行してください。',
            SUBSYSTEM_ERROR: '[SE] マシンを再起動してください',
            UNKNOWN_COMMAND: '[UC] 「Delta+/Delta ファームウェア」をアップデートしてください',
            RESOURCE_BUSY: '[RB] マシンを再起動するか、再試行してください'
        },
        device_selection: {
            no_printers: 'Wi-Fi経由でどのマシンも検出できません。お使いのPCとマシンが同じネットワーク下にあるかどうかを確認してください。<a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/215394548">さらなる情報</a>',
            no_beambox: '#801 Wi-Fi経由でどのマシンも検出できません。お使いのPCとマシンが同じネットワーク下にあるかどうかを確認してください。<a target="_blank" href="https://flux3dp.com/beambox-tutorial/">さらなる情報</a>',
            module: 'モジュール',
            status: 'ステータス'
        },
        update: {
            release_note: 'リリースノート：',
            firmware: {
                caption: 'このマシンのファームウェアアップデートがご利用いただけます',
                message_pattern_1: '「%s」は現在、ファームウェアアップデートの準備ができています。',
                message_pattern_2: '%sファームウェアv%sは現在ご利用いただけます - v%sがあります。',
                latest_firmware: {
                    caption: 'マシンのファームウェアアップデート',
                    message: 'あなたは最新のマシンファームウェアを使用しています',
                    still_update: 'アップデート'
                },
                confirm: 'アップロード',
                upload_file: 'ファームウェアのアップロード（*.bin / *.fxfw）',
                update_success: 'ファームウェアアップデートが正常にアップロードされました',
                update_fail: '#822 アップデート失敗'
            },
            software: {
                checking: 'アップデートの確認中',
                switch_version: 'バージョンを切り替える',
                check_update: 'アップデートを確認',
                caption: 'Beam Studioのソフトウェアアップデートがご利用いただけます',
                downloading: 'アップデートのダウンロード中…',
                install_or_not: 'アップデートがダウンロードされました。今すぐ再起動してインストールしますか？',
                switch_or_not: 'がダウンロードされました。今すぐ再起動してインストールしますか？',
                message_pattern_1: 'Beam Studioは現在、ソフトウェアアップデートの準備ができています。',
                message_pattern_2: 'FLUX Software v%sが現在ご利用いただけます。 - v%sがあります。',
                available_update: 'Beam Studio v%s が現在、ご利用いただけます\nv%sがあります。\nアップデートをダウンロードしますか？',
                available_switch: 'Beam Studio v%s が現在、ご利用いただけます\nv%sがあります。\nこのバージョンを切り替えますか？',
                not_found: 'あなたは、最新バージョンのBeam Studioを使用しています。',
                no_response: 'サーバーに接続できませんでした。ネットワーク設定を確認してください。',
                switch_version_not_found: '切り替えられるバージョンが見つかりません',
                yes: 'はい',
                no: 'いいえ',
                skip: 'Skip This Version'
            },
            toolhead: {
                caption: 'FLUXツールヘッドのファームウェアアップデートがご利用いただけます',
                message_pattern_1: '「%s」は現在、ツールヘッドのファームウェアアップデートの準備ができています。',
                message_pattern_2: 'FLUXツールヘッドのファームウェア%sが現在、ご利用いただけます。',
                latest_firmware: {
                    caption: 'ツールヘッドのファームウェアアップデート',
                    message: 'あなたは最新のツールヘッドファームウェアを使用しています'
                },
                confirm: 'アップロード',
                upload_file: 'ファームウェアのアップロード (*.bin)',
                update_success: 'ツールヘッドのファームウェアアップデートが正常にアップロードされました',
                update_fail: 'アップデート失敗',
                waiting: 'ツールヘッドを接続してください'
            },
            updating: 'アップデート中…',
            skip: 'このバージョンをスキップ',
            checkingHeadinfo: 'ツールヘッド情報の確認中',
            preparing: '準備中…',
            later: '後で',
            download: 'オンラインアップデート',
            cannot_reach_internet: '#823 サーバーにアクセスできません。<br/>インターネット接続を確認してください',
            install: 'インストール',
            upload: 'アップロード'
        },
        topmenu: {
            version: 'バージョン',
            ok: 'OK',
            sure_to_quit: '終了してもよろしいですか？',
            flux: {
                label: 'FLUX',
                about: 'バージョン情報',
                preferences: '環境設定',
                quit: '終了する'
            },
            file: {
                label: 'ファイル',
                import: 'インポート',
                save_fcode: 'FLUXタスクをエクスポート',
                save_scene: 'シーンを保存',
                save_svg: 'SVGをエクスポート',
                save_png: 'PNGをエクスポート',
                save_jpg: 'JPGをエクスポート',
                converting: '画像に変換中…',
                all_files: 'すべてのファイル',
                svg_files: 'SVG',
                png_files: 'PNG',
                jpg_files: 'JPG',
                bvg_files: 'Beamboxシーン',
                fcode_files: 'FLUXコード',
                fsc_files: '3D印刷シーン',
                confirmReset: 'すべての設定をリセットしてもよろしいですか？',
                clear_recent: '最近開いた項目をクリア',
                path_not_exit: 'このパスは、デスク上にもう存在しないようです。'
            },
            edit: {
                label: '編集する',
                duplicate: '複製する',
                rotate: '回転させる',
                scale: '拡大/縮小',
                clear: 'シーンをクリア',
                undo: '元に戻す',
                alignCenter: '中央揃え',
                reset: 'リセット'
            },
            device: {
                label: 'マシン',
                new: 'マシンのセットアップ',
                device_monitor: 'ダッシュボード',
                device_info: 'マシン情報',
                head_info: 'ツールヘッド情報',
                change_filament: '印刷材料を変更',
                default_device: 'デフォルトとして設定',
                check_firmware_update: 'ファームウェアをアップデート',
                update_delta: 'マシンのファームウェア',
                update_toolhead: 'ツールヘッドのファームウェア',
                calibrate: '自動レベリングを実行',
                set_to_origin: '原点を較正（ホーム）',
                movement_tests: '動作テストを実行',
                scan_laser_calibrate: 'スキャニングレーザーをオンにする',
                clean_calibration: 'クリーンデータを使用した自動レベリングを実行',
                commands: 'コマンド',
                set_to_origin_complete: 'このマシンは原点を較正しました。',
                scan_laser_complete: 'このマシンはスキャニングレーザーをオンにしました。[終了する]をクリックしてオフにします。',
                movement_tests_complete: '動作テストが完了しました',
                movement_tests_failed: '動作テストに失敗しました。<br/>1. ツールヘッドケーブルが正しく伸ばされていることを確認します。<br/>2. マシンへのツールヘッドケーブルのコネクターがマシンに約半分挿入していることを確認します。 <br/>3. 印刷ツールヘッドのコネクターを180度回転させてみます。<br/>4. <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/115003674128">この記事</a>をチェックしてください。',
                download_log: 'ログをダウンロード',
                download_log_canceled: 'ログのダウンロードをキャンセルしました',
                download_log_error: '不明なエラーが発生しました。後で再試行してください',
                log: {
                    network: 'ネットワーク',
                    hardware: 'ハードウェア',
                    discover: '検知する',
                    usb: 'USB',
                    usblist: 'USBリスト',
                    camera: 'カメラ',
                    cloud: 'クラウド',
                    player: 'プレーヤー',
                    robot: 'ロボット'
                },
                finish: '終了する',
                cancel: 'キャンセル',
                turn_on_head_temperature: 'ツールヘッドの温度を設定',
                network_test: 'ネットワークをテスト'
            },
            window: {
                label: 'ウィンドウ',
                minimize: '最小化する',
                fullscreen: 'フルスクリーン'
            },
            help: {
                label: 'ヘルプ',
                help_center: 'ヘルプセンター',
                contact: 'お問い合わせ',
                tutorial: '印刷のチュートリアルを開始',
                software_update: 'ソフトウェアのアップデート',
                debug: 'バグレポート',
                forum: 'コミュニティフォーラム'
            },
            account: {
                label: 'アカウント',
                sign_in: 'サインイン',
                sign_out: 'サインアウト'
            }
        },
        initialize: {
            // generic strings
            next: '次へ',
            start: '開始',
            skip: 'スキップ',
            cancel: 'キャンセル',
            confirm: '確認する',
            connect: '接続する',
            back: '戻る',
            retry: '再試行する',
            no_machine: '私は今マシンを持っていません。',

            // specific caption/content
            invalid_device_name: '名前には、中国語、アルファベット、数字、空白、および( ) - _ ’ \'といった特殊文字のみを含めることができます。',
            require_device_name: '名前が必要です',
            select_language: '言語を選択',
            change_password: {
                content: 'パスワードを変更してもよろしいですか？',
                caption: 'パスワードの変更'
            },
            connect_flux: 'マシンを接続',
            via_usb: 'USBケーブルの使用',
            via_wifi: 'Wi-Fiの使用',
            select_machine_type: 'マシンを選択してください',
            select_connection_type: 'どのように接続しますか',
            connection_types: {
                wifi: 'Wi-Fi',
                wired: '有線ネットワーク',
                ether_to_ether: 'イーサネット接続',
            },
            connect_wifi: {
                title: 'Wi-Fiで接続する',
                tutorial1: '1. タッチパネル > [インターネット]> [WiFi 設定] をクリックしてください。',
                tutorial2: '2. 使用したい Wi-Fi を選択して接続します。',
                what_if_1: '接続したい Wi-Fi が見えません',
                what_if_1_content: '1. Wi-Fi 暗号化モードは WPA2 またはパスワードなしである必要があります。\n2. 暗号化モードは、 Wi-Fi ルーターの管理インターフェイスで設定できます。ルーターが WPA2 をサポートしておらず、適切なルーターの選択についてサポートが必要な場合は、 FLUX サポートにお問い合わせください。',
                what_if_2: 'Wi-Fi が見えません',
                what_if_2_content: '1. Wi-Fi ドングルが完全に差し込まれていることを確認してください。\n2. タッチパネルに無線接続の MAC アドレスがない場合は、 FLUX サポートに連絡してください。\n3. Wi-Fi チャネルは 2.4Ghz である必要があります（ 5Ghz はサポートされていません）。',
            },
            connect_wired: {
                title: '有線ネットワークで接続する',
                tutorial1: '1. マシンをルーターに接続する.',
                tutorial2: '2. 「インターネット」を押して有線ネットワークIPを取得します。',
                what_if_1: 'IP が空の場合',
                what_if_1_content: '1. イーサネットケーブルが完全に差し込まれていることを確認します。\n2. タッチパネルに有線接続の MAC アドレスがない場合は、 FLUX サポートに連絡してください。',
                what_if_2: 'IP が 169 で始まる場合',
                what_if_2_content: '1. IP アドレスが 169.154 で始まる場合は、 DHCP 設定の問題であるはずです。詳細については、ISP（インターネットサービスプロバイダー）にお問い合わせください。\n2. コンピューターが PPPoE を使用して直接インターネットに接続している場合は、ルーターを使用して PPPoE を使用して接続し、ルーターで DHCP 機能を有効にしてください。'
            },
            connect_ethernet: {
                title: 'イーサネット接続',
                tutorial1: '1. イーサネットケーブルでマシンをコンピュータに接続してください。',
                tutorial2_1: '2. この',
                tutorial2_a_text: 'ガイド',
                tutorial2_a_href_mac: 'https://support.flux3dp.com/hc/en-us/articles/360001517076',
                tutorial2_a_href_win: 'https://support.flux3dp.com/hc/en-us/articles/360001507715',
                tutorial2_2: 'に従ってコンピュータをルーターにしてください。',
                tutorial3: '3. Nextをクリックしてください。',
            },
            connect_machine_ip: {
                enter_ip: 'マシン IP を入力してください',
                check_ip: 'IP 可用性の確認しています',
                check_firmware: 'ファームウェアバージョンの確認しています',
                check_camera: 'カメラの可用性を確認しています',
                retry: '再試行',
                finish_setting: '設定完了'
            },
            name_your_flux: 'マシンに名前を付ける',
            wifi_setup: 'Wi-Fiのセットアップ',
            select_preferred_wifi: '優先ネットワークを選択',
            requires_wifi_password: 'にはパスワードが必要です。',
            connecting: '接続中…',

            set_connection: '%s 接続のセットアップ',
            please_goto_touchpad: 'Beamboxタッチアップに移動してください',
            tutorial: '1. タッチパッドの[インターネット]>[WiFi 設定]をクリックします。\n2. お使いのWi-Fiを選択し、パスワードを入力します。\n3. 10秒待つと、ワイヤレスIPアドレスが[設定]>[インターネット]で表示されます。\n4. Wi-Fiが使用できない場合、DHCPを有効にしたルーターを使用して、イーサネットポートに接続します。\n5. ここにマシンIPを入力します。',
            please_see_tutorial_video: 'チュートリアルビデオ',
            tutorial_url: 'https://flux3dp.com/beambox-tutorial/',
            ip_wrong: 'IP形式が間違っています。再入力してください。',

            set_machine_generic: {
                printer_name: '名前*',
                printer_name_placeholder: 'マシンに一意の名前を付けてください',
                old_password: '現在のパスワード',
                password: 'パスワード',
                set_station_mode: 'ネットワークを作成',
                password_placeholder: 'パスワードでマシンを保護',
                incorrect_old_password: '現在のパスワードが正しくありません',
                incorrect_password: '#828 パスワードが正しくありません',
                ap_mode_name: 'ネットワーク名',
                ap_mode_pass: 'パスワード',
                ap_mode_name_format: 'アルファベットまたは数字のみを受け入れます',
                ap_mode_pass_format: '少なくとも8文字',
                ap_mode_name_placeholder: '最大32文字まで。',
                ap_mode_pass_placeholder: '少なくとも8文字が必要です。',
                create_network: 'ネットワークを作成',
                join_network: '他のネットワークに加わる',
                security: 'セキュリティ'
            },

            setting_completed: {
                start: '開始',
                is_ready: '%s」の準備ができました',
                station_ready_statement: 'お使いのマシンはWi-Fiステーションになりました。Wi-Fi「%s」に接続することによって、マシンをワイヤレスで使用できます',
                brilliant: '素晴らしい！',
                begin_journey: 'USB / Micro USBケーブルを取り外して、創造性の旅を始めることができます。',
                great: 'Beam Studioへようこそ',
                setup_later: 'タイトルバ >「マシン」>「マシン設定」からいつでもマシンをセットアップできます。',
                upload_via_usb: 'Wi-Fi接続は後でセットアップできます。<br/>Wi-Fiがない場合、<a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/215998327-Connection-Guide-for-Desktop-PCs">「デスクトップ接続ガイド」</a>をチェックしてください。',
                back: '戻る',
                ok: '作成を開始'
            },

            notice_from_device: {
                headline: 'マシンのWi-Fiインジケーターを確認',
                subtitle: 'Wi-Fi接続のステータスに注意してください。',
                light_on: 'ランプ点灯',
                light_on_desc: 'マシンは、あなたが指定したWi-Fiに接続しました',
                breathing: 'ブリージング',
                breathing_desc: 'Wi-Fiに失敗しました。設定をやり直してください。',
                successfully: 'マシンが正常に接続した場合',
                successfully_statement: 'Wi-Fiリストに戻り、PCを%sに接続してから、FLUX Studioを再起動してください',
                restart: 'FLUX Studioを再起動'
            },

            // errors
            errors: {
                error: 'エラー',
                close: '閉じる',
                not_found: '見つかりません',
                not_support: 'USB経由でマシンのファームウェアをv1.6+にアップデートしてください',

                keep_connect: {
                    caption: 'USB接続が見つかりません',
                    content: 'おっと！ご心配なく。当社にお任せください。\n確認してください\n1. Wi-Fiインジケーター（緑色LED）が点滅、ブリージング、または点灯しています。 \n2. ドライバーが正しくインストールされています。<a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/215327328">（さらなる情報）</a>\n3. 再度差し込み、10秒間待ちます。'
                },

                wifi_connection: {
                    caption: '接続できません',
                    connecting_fail: 'Wi-Fi信号が強く、かつパスワードが正しいことを確認してください。'
                },

                select_wifi: {
                    ap_mode_fail: 'セットアップに失敗しました。'
                }
            }
        },
        wifi: {
            home: {
                line1: '利用可能なWi-Fiにアクセスできますか？',
                line2: 'お使いのFLUXをWi-Fiに接続するお手伝いを致します',
                select: 'はい'
            },
            set_password: {
                line1: 'Wi-Fiネットワークのパスワード',
                line2: '入力してください',
                password_placeholder: 'ここにWi-Fiパスワードを入力してください',
                back: '戻る',
                join: '加わる',
                connecting: '接続中です'
            },
            success: {
                caption: 'すごい！正常に接続しました！',
                line1: '今度は、マシンに簡単な設定を行います。',
                next: '次へ'
            },
            failure: {
                caption: '接続に失敗しました。',
                line1: 'Wi-Fiが適切に動作していることを確認してから、再接続してください。',
                next: '再接続する'
            },
            set_printer: {
                caption: 'FLUX3Dプリンターの名前とパスワードを設定してください。',
                printer_name: '名前',
                printer_name_placeholder: '名前を設定',
                password: 'パスワード',
                password_placeholder: 'パスワードを設定',
                notice: 'パスワードを設定し、そのパスワードを知っているユーザーだけがFLUX Deltaを使用できるようにします。',
                next: '次へ'
            }
        },
        menu: {
            print: '印刷する',
            laser: '彫刻する',
            scan: 'スキャン',
            usb: 'USB',
            device: 'マシン',
            setting: '設定',
            draw: '描く',
            cut: 'カット',
            beambox: 'ミル',
            mill: 'MILL',
            mm: 'mm',
            inches: 'インチ'
        },
        settings: {
            on: 'オン',
            off: 'オフ',
            low: '低',
            high: '普通',
            caption: '設定',
            tabs: {
                general: '一般',
                device: 'マシン'
            },
            ip: 'マシンIPアドレス',
            guess_poke: 'マシンIPを自動的に検索',
            wrong_ip_format: '間違ったIP形式',
            lock_selection: 'ロック選択',
            default_machine: 'デフォルトマシン',
            default_machine_button: '空いている',
            remove_default_machine_button: '削除する',
            confirm_remove_default: 'デフォルトマシンが削除されます。',
            reset: 'Beam Studioをリセット',
            reset_now: 'Beam Studioをリセット',
            confirm_reset: 'Beam Studioのリセットを確認しますか？',
            language: '言語',
            notifications: '通知',
            check_updates: '自動チェック',
            updates_version: 'バージョン',
            default_app: 'デフォルトアプリ',
            default_units: 'デフォルト単位',
            default_font_family: 'デフォルトのフォント',
            default_font_style: 'デフォルトのフォントスタイル',
            fast_gradient: '高速彫刻',
            vector_speed_constraint: 'エクスポート速度を制限する',
            loop_compensation: 'ループ補正',
            blade_radius: 'Blade Radius',
            blade_precut_switch: 'Blade Precut',
            blade_precut_position: 'Precut Position',
            delta_series: 'Delta群',
            beambox_series: 'Beambox群',
            default_model: 'デフォルトモデル<br />（印刷設定用）',
            default_beambox_model: 'デフォルト作業エリア',
            guides_origin: 'ガイドの原点',
            guides: 'ガイド',
            image_downsampling: 'ビットマップの品質',
            continuous_drawing: '連続描画',
            mask: 'ワークエリアのクリッピング',
            optimization: '最適化',
            font_substitute: 'サポートされていない文字を置き換える',
            default_borderless_mode: 'オープンボトム既定',
            default_enable_autofocus_module: 'オートフォーカス既定',
            default_enable_diode_module: 'ハイブリッドレーザー既定',
            diode_offset: 'ハイブリッドレーザーオフセット',
            none: 'なし',
            close: '閉じる',
            enabled: '有効',
            disabled: '無効',
            cancel: 'キャンセル',
            done: '適用する',
            groups: {
                general: '一般',
                update: 'ソフトウェア更新',
                connection: '接続',
                editor: 'エディター',
                path: 'パス',
                engraving: '彫刻',
                mask: 'ワークエリアのクリッピング',
                text_to_path: 'パスへのテキスト',
                modules: '拡張機能',
            },
            connect_printer: {
                title: 'プリンターと接続する'
            },
            notification_on: 'オン',
            notification_off: 'オフ',
            update_latest: '最新',
            update_beta: 'ベータ',
            engine_change_fail: {
                'caption': 'エンジンを変更できません',
                '1': 'チェック中のエラー',
                '2': 'Curaバージョンエラー',
                '3': 'パスはCuraではありません',
                '4': 'パスは既存のファイルではありません。設定セクションでエンジンパスを確認してください'
            },
            allow_tracking: 'アプリを改善するために、匿名の利用状況統計をFLUXに送信しますか？',
            flux_cloud: {
                processing: '処理中…',
                flux_cloud: 'FLUXクラウド',
                back: '戻る',
                next: '次へ',
                done: '完了済み',
                sign_in: 'サインイン',
                sign_up: 'サインアップ',
                success: '成功',
                fail: '失敗',
                cancel: 'キャンセル',
                try_again: '再試行する',
                bind: 'バインドする',
                bind_another: '別のものをバインドする',
                username: 'ユーザー名',
                nickname: 'ニックネーム',
                email: 'Eメール',
                password: 'パスワード',
                re_enter_password: 'パスワードを再入力',
                forgot_password: 'パスワードをお忘れですか？',
                sign_up_statement: 'FLUX IDをお持ちでない場合は、ここで<a href="%s">サインアップ</a>してください',
                try_sign_up_again: 'もう一度<a href="%s">サインアップ</a>してみてください',
                agreement: 'FLUXの <a href="#/studio/cloud/privacy">プライバシー</a>、 <a href="#/studio/cloud/terms">利用規約</a>に同意する',
                pleaseSignIn: 'FLUX IDでサインインしてください',
                enter_email: 'メールアドレスを入力してください',
                check_inbox: 'メールボックスに移動してチェックしてください！',
                error_blank_username: 'ニックネームは空白にできません',
                error_blank_email: 'Eメールは空白にできません',
                error_email_format: '正しいEメールを入力してください',
                error_email_used: 'メールアドレスが使用されました',
                error_password_not_match: 'パスワードが確認パスワードと一致しません。',
                select_to_bind: 'バインドするマシンを選択',
                binding_success: 'マシンを正常にバインドしました！',
                binding_success_description: 'FLUXアプリを使用してマシンのステータスを確認できるようになりました',
                binding_fail: 'バインディングに失敗しました',
                binding_fail_description: 'ネットワークエラーが原因である可能性があります。再試行してください',
                binding_error_description: 'マシンのクラウド機能をオンにできません。エラーログでサポートにご連絡ください',
                retrieve_error_log: 'ダウンロードエラー',
                binding: 'バインド中…',
                check_email: '手順についてはEメールを確認してください',
                email_exists: 'Eメールは存在します',
                not_verified: 'Eメールは確認されていません',
                user_not_found: 'Eメールまたはパスワードが正しくありません',
                resend_verification: '確認Eメールを再送信',
                contact_us: 'Eメールおよび遭遇した問題についてはFLUXサポートにご連絡ください',
                confirm_reset_password: 'あなたのパスワードをリセットしますか？',
                format_error: '認証情報が正しくありません',
                agree_to_terms: '規約に同意してください',
                back_to_list: 'リストに戻る',
                change_password: 'パスワードを変更',
                current_password: '現在のパスワード',
                new_password: '新しいパスワード',
                confirm_password: 'パスワードを確認',
                empty_password_warning: 'パスワードは空にできません',
                WRONG_OLD_PASSWORD: '現在のパスワードが正しくありません',
                FORMAT_ERROR: '間違ったパスワード形式',
                submit: '保存する',
                sign_out: 'サインアウト',
                not_supported_firmware: 'マシンのファームウェアをクラウド機能のために\nv1.5以降にアップグレードしてください',
                unbind_device: 'このマシンのバインドを解除しますか？',
                CLOUD_SESSION_CONNECTION_ERROR: 'このマシンはクラウドサーバーにアクセスできません。マシンを再起動してください。',
                CLOUD_UNKNOWN_ERROR: 'このマシンはクラウドサーバーに接続できません。マシンを再起動してください。',
                SERVER_INTERNAL_ERROR: 'サーバーの内部エラーです。後で再試行してください。',
            }
        },
        print: {
            import: 'インポート',
            save: '保存する',
            start_print: '印刷する',
            gram: 'g',
            advanced: {
                general: '一般',
                layers: '層',
                infill: 'インフィル',
                support: 'サポート',
                speed: '速度',
                custom: 'テキスト',
                slicingEngine: 'スライスエンジン',
                slic3r: 'Slic3r',
                cura: 'Cura',
                cura2: 'Cura2',
                filament: 'フィラメント',
                temperature: '材料と温度',
                detect_filament_runout: 'フィラメント検出',
                flux_calibration: '自動較正',
                detect_head_tilt: '傾斜検出',
                layer_height_title: '層の高さ',
                layer_height: '層の高さ',
                firstLayerHeight: '最初の層の高さ',
                shell: 'シェル',
                shellSurface: 'シェル表面',
                solidLayerTop: 'ソリッド層：上部',
                solidLayerBottom: 'ソリッド層：下部',
                density: '密度',
                pattern: 'パターン',
                auto: 'auto',                       // do not change
                line: 'Line',                       // do not change
                rectilinear: 'Rectilinear',         // do not change
                rectilinearGrid: 'Rectilinear Grid',// do not change
                honeycomb: 'Honeycomb',             // do not change
                offset: 'オフセット',
                xyOffset: '水平展開',
                zOffset: 'Zオフセット',
                cutBottom: '下部をカット',
                curaInfill: {
                    automatic: '自動',
                    grid: 'グリッド',
                    lines: 'ライン',
                    concentric: '同心円',
                    concentric_3d: '同心円3D',
                    cubic: 'キュービック',
                    cubicsubdiv: '立方体細分',
                    tetrahedral: '四面体',
                    triangles: '三角形',
                    zigzag: 'ジグザグ'
                },
                curaSupport: {
                    lines: 'ライン',
                    grid: 'グリッド',
                    zigzag: 'ジグザグ'
                },
                blackMagic: 'ブラックマジック',
                spiral: 'スパイラル',
                generalSupport: '一般的なサポート',
                spacing: 'ライン距離',
                overhang: 'オーバーハング',
                zDistance: 'Z距離',
                raft: 'ラフト',
                raftLayers: 'ラフト層',
                brim: 'ブリムの幅',
                skirts: 'スカート',
                movement: '動作',
                structure: '構造',
                traveling: '移動',
                surface: '表面',
                firstLayer: '最初の層',
                solidLayers: 'ソリッド層',
                innerShell: '内側シェル',
                outerShell: '外側シェル',
                bridge: 'ブリッジ',
                config: 'エキスパート設定',
                presets: '設定',
                name: '名前',
                apply: '適用する',
                save: '保存する',
                saveAsPreset: '設定を保存',
                cancel: 'キャンセル',
                delete: '削除する',
                loadPreset: '設定を読み込む',
                savePreset: '設定を保存',
                reloadPreset: '設定をリセット',
                printing: '印刷',
                firstLayerTemperature: '最初の層',
                flexibleMaterial: '柔軟性のある材料'
            },
            mode: [
                {
                    value: 'beginner',
                    label: 'ビギナー',
                    checked: true
                },
                {
                    value: 'expert',
                    label: 'エキスパート'
                }
            ],
            params: {
                beginner: {
                    print_speed: {
                        text: '印刷速度',
                        options: [
                            {
                                value: 'slow',
                                label: '低速',
                                selected: true
                            },
                            {
                                value: 'fast',
                                label: '高速'
                            }
                        ]
                    },
                    material: {
                        text: '材料',
                        options: [
                            {
                                value: 'pla',
                                label: 'PLA（ポリ乳酸）',
                                selected: true
                            }
                        ]
                    },
                    support: {
                        text: 'サポート',
                        on: 'オン',
                        off: 'オフ',
                        options: [
                            {
                                value: 'Touching',
                                label: 'タッチ',
                                checked: true
                            },
                            {
                                value: 'nowhere',
                                label: '対象外'
                            }
                        ]
                    },
                    platform: {
                        text: 'プラットフォーム',
                        options: [
                            {
                                value: 'raft',
                                label: 'ラフト',
                                checked: true
                            }
                        ]
                    }
                },
                expert: {
                    layer_height: {
                        text: '層の高さ',
                        value: 0.3,
                        unit: 'mm'
                    },
                    print_speed: {
                        text: '印刷速度',
                        value: 50,
                        unit: 'mm/秒'
                    },
                    temperature: {
                        text: '温度',
                        value: 231,
                        unit: '°C'
                    },
                    support: {
                        text: 'サポート',
                        options: [
                            {
                                value: 'everywhere',
                                label: '全対象',
                                checked: true
                            },
                            {
                                value: 'nowhere',
                                label: '対象外'
                            }
                        ]
                    },
                    platform: {
                        text: 'プラットフォーム',
                        options: [
                            {
                                value: 'raft',
                                label: 'ラフト',
                                checked: true
                            }
                        ]
                    }
                }
            },
            left_panel: {
                raft_on: 'ラフトオン',
                raft_off: 'ラフトオフ',
                support_on: 'サポートオン',
                support_off: 'サポートオフ',
                advanced: '詳細設定',
                preview: 'プレビュー',
                plaTitle: 'フィラメントの色を選ぶ',
                transparent: '透明化',
                raftTitle: 'ラフトとは、オブジェクトの下に作られる層のことで、オブジェクトがベースプレートに固着するのに役立ちます',
                supportTitle: 'サポートとは、フィラメントの落下を防ぐために、オブジェクトのオーバーハング部分を支える生成構造物です',
                advancedTitle: '詳細に3D印刷パラメーターを調整することによって、デフォルトよりも良い結果が得られる場合があります。',
                confirmExitFcodeMode: 'プレビューモードを終了するとFCodeがアンロードされますが、よろしいですか？'
            },
            right_panel: {
                get: '取得する',
                go: '実行',
                preview: 'プレビュー'
            },
            quality: {
                high: '高品質',
                med: '中品質',
                low: '低品質',
                custom: 'カスタム品質'
            },
            model: {
                fd1: 'DELTA',
                fd1p: 'DELTA+'
            },
            scale: '拡大/縮小',
            rotate: '回転させる',
            delete: '削除する',
            reset: 'リセット',
            cancel: 'キャンセル',
            done: '完了済み',
            pause: '一時停止',
            restart: '再起動',
            download_prompt: 'ファイル名を入力してください',
            importTitle: '3Dモデルをインポート（.stl）',
            getFcodeTitle: 'ツールヘッドのパスと設定をFCodeファイル（*.fc）に保存',
            goTitle: '印刷の準備をする',
            deviceTitle: 'マシンモニターを表示',
            rendering: 'スライス',
            reRendering: '再スライス',
            finishingUp: '最後の仕上げをしています…',
            savingFilePreview: 'ファイルプレビューの保存中',
            uploading: 'スライスエンジンへのアップロード中',
            uploaded: 'アップロードされましたので、スライスエンジンが処理しています…',
            importingModel: 'モデルのインポート中',
            wait: 'お待ちください…',
            out_of_range: '範囲外',
            out_of_range_message: 'オブジェクトのサイズを小さくしてください',
            drawingPreview: 'プレビューパスを描画していますので、お待ちください',
            gettingSlicingReport: 'スライスステータスの取得中'
        },
        draw: {
            pen_up: '移動の高さ',
            pen_down: '描画の高さ',
            speed: '速度',
            pen_up_title: 'ペンが描画面に接触しない高さ',
            pen_down_title: 'ペンが描画面に接触する高さは、移動の高さより低くなければなりません',
            speed_title: '描画速度',
            units: {
                mms: 'mm/秒',
                mm: 'mm'
            }
        },
        cut: {
            horizontal_calibrate: '水平\n調整',
            height_calibrate: '高さ\n調整',
            running_horizontal_adjustment: '水平調整を実行中…',
            running_height_adjustment: '高さ調整を実行中…',
            run_height_adjustment: 'ブレードを調整し、高さ調整を実行してください',
            horizontal_adjustment_completed: '水平調整が完了しました',
            height_adjustment_completed: '高さ調整が完了しました',
            you_can_now_cut: 'おめでとう！これで、シートのカットを開始できます。',
            zOffset: '高さオフセット',
            overcut: 'オーバーカット',
            speed: '速度',
            bladeRadius: 'ブレード半径',
            backlash: 'バックラッシュ補正',
            zOffsetTip: '厚めのビニールの場合、またはカットが強すぎたり弱すぎたりするのを防ぐには、切断高さを調整します',
            overcutTip: '簡単に剥がすためのオーバーカットループ',
            speedTip: '切断速度',
            backlashTip: 'サードパーティのブレードを使用するときに、直線がいまいち真っすぐになっていない場合は、値を調整します。',
            units: {
                mms: 'mm/秒',
                mm: 'mm'
            }
        },
        mill: {
            calibrate: '自動\nレベル',
            zOffset: '切断高さ',
            overcut: 'オーバーカット',
            speed: '速度',
            repeat: '繰り返す',
            stepHeight: 'ステップの高さ',
            backlash: 'バックラッシュ補正',
            zOffsetTip: '厚めのビニールの場合、およびカットが強すぎたり弱すぎたりするのを防ぐには、切断高さを調整します',
            overcutTip: '簡単に剥がすためのオバーカットループ',
            speedTip: '切断速度',
            backlashTip: '直線がいまいち真っすぐになっていない場合は、値を調整します',
            units: {
                mms: 'mm/秒',
                mm: 'mm'
            }
        },
        laser: {
            import: 'インポート',
            save: '保存する',
            custom: 'カスタム',
            presets: '設定を読み込む',
            button_advanced: '詳細設定',
            confirm: '確認する',
            get_fcode: 'タスクを<br/>保存',
            export_fcode: 'ファイルとして保存…',
            name: '名前',
            go: '実行',
            showOutline: '表示\nフレーム',
            do_calibrate: 'あなたは初めて彫刻を使用しているようですが、パッケージに入っているクラフトカードを使用すると、最適な焦点距離を見つけることができます。較正画像を読み込みますか？後で[詳細設定]で読み込むこともできます。',
            process_caption: '生成中',
            laser_accepted_images: 'サポートされている形式： BMP/GIF/JPG/PNG/SVG',
            draw_accepted_images: 'サポートされている形式： SVG',
            svg_fail_messages: {
                'TEXT_TAG': 'SVGタグ &lt;text&gt; は、サポートされていません',
                'DEFS_TAG': 'SVGタグ &lt;defs&gt; は、サポートされていません',
                'CLIP_TAG': 'SVGタグ &lt;clip&gt; は、サポートされていません',
                'FILTER_TAG': 'SVGタグ &lt;filter&gt; は、サポートされていません',
                'EMPTY': 'は空のファイルです',
                'FAIL_PARSING': 'プロセスの解析に失敗しました',
                'SVG_BROKEN': 'が壊れた',
                'NOT_SUPPORT': 'このファイルはSVGではありません'
            },
            title: {
                material: '最高の彫刻結果を得るために、適切な材料を選んでください。',
                object_height: 'ベースプレートからオブジェクトの最大の高さまでを測定したオブジェクトの高さ',
                height_offset: '最適なレーザー集束のためにZ位置を調整',
                shading: 'シェーディングは、レーザー彫刻のグラデーション効果を可能にします。より時間がかかります。',
                advanced: 'C出力と速度のカスタム設定。'
            },
            print_params: {
                object_height: {
                    text: 'オブジェクトの高さ',
                    unit: 'mm'
                },
                height_offset: {
                    text: 'フォーカスオフセット',
                    unit: 'mm'
                },
                shading: {
                    text: 'シェーディング',
                    textOn: 'オン',
                    textOff: 'オフ',
                    checked: true
                }
            },
            object_params: {
                position: {
                    text: '位置'
                },
                size: {
                    text: 'サイズ',
                    unit: {
                        width: 'W（幅）',
                        height: 'H（高さ）'
                    }
                },
                rotate: {
                    text: '回転させる'
                },
                threshold: {
                    text: 'しきい値',
                    default: 128
                }
            },
            advanced: {
                label: 'セットアップ',
                form: {
                    object_options: {
                        text: '材料',
                        label: 'オブジェクトオプション',
                        options: [
                            {
                                value: 'cardboard',
                                label: 'クラフト紙',
                                data: {
                                    laser_speed: 10,
                                    power: 255
                                }
                            },
                            {
                                value: 'wood',
                                label: '木材',
                                data: {
                                    laser_speed: 3,
                                    power: 255
                                }
                            },
                            {
                                value: 'leather',
                                label: 'レザー',
                                data: {
                                    laser_speed: 5,
                                    power: 255
                                }
                            },
                            {
                                value: 'paper',
                                label: '紙',
                                data: {
                                    laser_speed: 2,
                                    power: 255
                                }
                            },
                            {
                                value: 'cork',
                                label: 'コルク',
                                data: {
                                    laser_speed: 5,
                                    power: 255
                                }
                            },
                            {
                                value: 'other',
                                label: 'その他',
                                data: {}
                            }
                        ]
                    },
                    laser_speed: {
                        text: 'レーザー速度',
                        unit: 'mm/s',
                        fast: '高速',
                        slow: '低速',
                        min: 0.8,
                        max: 20,
                        step: 0.1
                    },
                    power: {
                        text: '出力',
                        high: '高い',
                        low: '低い',
                        min: 0,
                        max: 255,
                        step: 1
                    }
                },
                save_and_apply: '保存して適用',
                save_as_preset: '保存する',
                save_as_preset_title: '設定を保存',
                load_preset_title: '設定を読み込む',
                background: '背景',
                removeBackground: ' 背景を削除',
                removePreset: '選択したプリセットは削除されます',
                load_calibrate_image: '較正画像を読み込む',
                apply: '適用する',
                cancel: 'キャンセル',
                save: '保存する'
            }
        },
        scan: {
            stop_scan: '停止',
            over_quota: 'クォータ超過',
            convert_to_stl: '変換する',
            scan_again: '再度スキャン',
            start_multiscan: '追加スキャン',
            processing: '処理中…',
            remaining_time: '左',
            do_save: 'STLを保存',
            go: '実行',
            rollback: '戻る',
            error: 'エラー',
            confirm: '確認する',
            caution: '注意',
            cancel: 'キャンセル',
            delete_mesh: '削除しますか？',
            quality: '品質',
            scan_again_confirm: '現在のスキャン結果を破棄しますか？',
            calibrate: '較正する',
            calibration_done: {
                caption: '較正完了',
                message: 'これでスキャンできます'
            },
            cant_undo: '元に戻すことができません',
            estimating: '時間の見積もり中…',
            calibrate_fail: '較正に失敗しました',
            calibration_is_running: 'スキャンの較正中',
            calibration_firmware_requirement: 'ファームウェアを1.6.9以降にアップグレードしてください',
            resolution: [{
                id: 'best',
                text: 'ベスト',
                time: '～30分',
                value: 1200
            },
            {
                id: 'high',
                text: '高い',
                time: '～20分',
                value: 800
            },
            {
                id: 'normal',
                text: '通常',
                time: '～10分',
                value: 400
            },
            {
                id: 'low',
                text: '低い',
                time: '~5分',
                value: 200
            },
            {
                id: 'draft',
                text: 'ドラフト',
                time: '~2分',
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
                filter: 'フィルター',
                position: '位置',
                size: 'サイズ',
                rotate: '回転させる',
                crop: '切り抜き',
                manual_merge: 'マージ',
                clear_noise: 'ノイズ除去',
                save_pointcloud: 'エクスポート'
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
                    caption: 'カメラが検出されません / 暗すぎます',
                    message: '最後に音が出るまで、スキャニングカメラを引き出してください。'
                },
                'no object': {
                    caption: '較正ツールが検出されません',
                    message: '較正ツールを中央のスロットに挿入し、十分な照明があることを確認します。'
                },
                'no laser': {
                    caption: 'スキャニングレーザーが検出されません',
                    message: 'レーザーヘッドを押して開け、照明が強すぎないことを確認します。'
                }
            }
        },
        beambox: {
            tag:{
                g: 'グループ',
                use: 'Import Svg',
                image: '画像',
                text: 'テキスト'
            },
            toolbox: {
                ALIGN_LEFT: '左揃え',
                ALIGN_RIGHT: '右揃え',
                ALIGN_TOP: '上揃え',
                ALIGN_BOTTOM: '下揃え',
                ALIGN_CENTER: '中央揃え',
                ALIGN_MIDDLE: '中央寄せ',
                ARRANGE_HORIZON: '水平に配置',
                ARRANGE_VERTICAL: '垂直に配置',
                ARRANGE_DIAGONAL: '斜めに配置'
            },
            popup: {
                select_favor_input_device: 'より良いユーザー体験が最適化されました。<br/>お好みの入力デバイスを選択してください。',
                select_import_method: '積層スタイルを選択：',
                touchpad: 'タッチパッド',
                mouse: 'マウス',
                layer_by_layer: '層',
                layer_by_color: '色',
                nolayer: '単一層',
                loading_image: '画像を読み込んでいます。お待ちください…',
                no_support_text: 'Beam Studioは現在、テキストタグをサポートしていません。インポートする前にテキストをパスに変換してください。',
                power_too_high_damage_laser_tube: 'より低いレーザー出力を使用すると、レーザー管の寿命が延びます。' ,
                speed_too_high_lower_the_quality: 'この解像度で速すぎる速度を使用すると、シェーディング彫刻の品質が低下する場合があります。',
                both_power_and_speed_too_high: 'より低いレーザー出力を使用すると、レーザー管の寿命が延びます。\nまた、この解像度で速度が速すぎると、シェーディング彫刻の品質が低下する場合があります。',
                too_fast_for_path: 'パスオブジェクトを含む層で速すぎる速度を使用すると、切断時に精度が低下する場合があります。\n切断時に 20mm/s より速い速度を使用することはお勧めしません。',
                too_fast_for_path_and_constrain: '次のレイヤー：％s \ nベクターパスオブジェクトが含まれていて、速度が 20mm/sを超えています。\ nベクターパスオブジェクトの切断速度は 20mm/s に制限されます。\ nこの制限は[好み]で削除できます。',
                should_update_firmware_to_continue: '#814 ご使用のファームウェアは、Beam Studioの一部の改善をサポートしていません。パフォーマンスとユーザー体験を向上させるには、ファームウェアをアップデートして続行してください。（メニュー>マシン>[お使いのマシン]>ファームウェアのアップデート',
                more_than_two_object: 'オブジェクトが多すぎます。2つのオブジェクトのみをサポートします',
                not_support_object_type: 'オブジェクトタイプをサポートしていません',
                select_first: '最初にオブジェクトを選択します。',
                select_at_least_two: '2つのオブジェクトを選択して続行します',
                import_file_contain_invalid_path: '#808 インポートされたSVGファイルに無効は画像パスが含まれています。すべての画像ファイルが存在することを確認するか、ファイルに画像を埋め込んでください',
                import_file_error_ask_for_upload: 'インポートされたSVGファイルに失敗しました。バグレポート用のチームを開発するためのファイルを提供してもよろしいですか？',
                upload_file_too_large: '#819 ファイルが大きすぎてアップロードできません。',
                successfully_uploaded: 'ファイルのアップロードに成功しました。',
                upload_failed: '#819 ファイルのアップロードに失敗しました。',
                or_turn_off_borderless_mode: ' または、ボーダーレスモードをオフにします。',
                svg_1_1_waring: 'このSVGファイルのバージョンはv 1.1です。非互換性の問題が発生する可能性があります。',
                svg_image_path_waring: 'このSVGファイルには、ファイルパスからロードされた<image>が含まれています。ロード時に失敗する可能性があります。\nこの可能性を回避するには、SVGをエクスポートするときに埋め込み画像（embed）を使用してください。',
                dxf_version_waring: 'このDXFファイルのバージョンは2013ではありません。非互換性の問題が発生する可能性があります。',
                dont_show_again: '次回から表示しない',
                convert_to_path_fail: 'パスへの変換に失敗しました。',
                save_unsave_changed: '未保存の変更を保存しますか？',
                dxf_bounding_box_size_over: '図面サイズがワークエリア外です。図面をCADソフトウェアの原点に近づけるか、単位が正しく設定されていることを確認してください。',
                progress: {
                    uploading: 'Uploading'
                },
                backend_connect_failed_ask_to_upload: '#802 バックエンドに接続しようとすると、エラーが発生し続けます。バグレポートログをアップロードしますか？',
                pdf2svg: {
                    error_when_converting_pdf: '#824 エラー：PDFをSVGに変換するときのエラー：',
                    error_pdf2svg_not_found: '#825 エラー：コマンド pdf2svg が見つかりません。パッケージマネージャーで pdf2svg をインストールしてください（例："yum install pdf2svg" or "apt-get install pdf2svg"）。',
                },
                ungroup_use: 'これにより、インポートされた dxf または svg がグループ解除されます。ファイルには大量の要素が含まれている可能性があるため、グループ解除に時間がかかる場合があります。続行してもよろしいですか？',
            },
            zoom_block: {
                fit_to_window: 'ウィンドウに合わせる',
            },
            left_panel: {
                insert_object: 'オブジェクトを挿入',
                preview: 'プレビュー',
                borderless: '（ボーダーレス）',
                advanced: '詳細設定',
                image_trace: 'トレース画像',
                suggest_calibrate_camera_first: 'カメラを較正してください。（メニュー>マシン>[お使いのマシン]>カメラを較正\nより良いプレビュー結果を実行するには、プラットフォームを使用するたびにプラットフォームを適切に再フォーカスします。',
                end_preview: 'プレビューモードを終了',
                unpreviewable_area: 'ブラインドエリア',
                diode_blind_area: 'ハイブリッドアドオンのブラインドエリア',
                borderless_blind_area: '非彫刻エリア',
                borderless_preview: 'ボーダーレスモードのカメラプレビュー',
                rectangle: '長方形',
                ellipse: '楕円',
                line: 'ライン',
                image: '画像',
                text: 'テキスト',
                label: {
                    cursor: '選択する',
                    photo: '画像',
                    text: 'テキスト',
                    line: 'ライン',
                    rect: '長方形',
                    oval: '楕円形',
                    polygon: '多角形',
                    pen: 'ペン',
                    array: '配列',
                    preview: 'カメラプレビュー',
                    trace: 'トレース画像',
                    clear_preview: 'プレビューをクリア'
                },
                insert_object_submenu: {
                    rectangle: '長方形',
                    ellipse: '楕円',
                    line: 'ライン',
                    image: '画像',
                    text: 'テキスト',
                    path: 'パス',
                    polygon: '多角形'
                },
            },
            right_panel: {
                tabs: {
                    layers: 'レイヤ',
                    objects: 'オブジェクト',
                },
                layer_panel: {
                    layer1: 'レイヤ 1',
                    layer_bitmap: 'ビットマップ',
                    layer_engraving: '彫る',
                    layer_cutting: '切る',
                    move_elems_to: '移動先レイヤ:',
                    layers: {
                        layer: 'レイヤ',
                        layers: 'Layers',
                        del: 'レイヤの削除',
                        move_down: 'レイヤを下へ移動',
                        new: '新規レイヤ',
                        rename: 'レイヤの名前を変更',
                        move_up: 'レイヤを上へ移動',
                        dupe: 'レイヤーを複製',
                        lock: 'レイヤーをロック',
                        merge_down: 'マージダウン',
                        merge_all: 'すべてをマージ',
                        move_elems_to: '移動先レイヤ:',
                        move_selected: '選択対象を別のレイヤに移動'
                    },
                    notification: {
                        dupeLayerName: '同名のレイヤーが既に存在します。',
                        newName: '新しい名前',
                        enterUniqueLayerName: '新規レイヤの一意な名前を入力してください。',
                        enterNewLayerName: 'レイヤの新しい名前を入力してください。',
                        layerHasThatName: '既に同名が付いています。',
                        QmoveElemsToLayer: '選択した要素をレイヤー \'%s\' に移動しますか？',
                    },
                },
                laser_panel: {
                    parameters: 'パラメーター',
                    strength: '出力',
                    speed: '速度',
                    repeat: '実行',
                    focus_adjustment: 'フォーカスを調整する',
                    height: '高さ',
                    z_step: 'Z Step',
                    diode: 'ダイオードレーザー',
                    times: '回',
                    cut: 'カット',
                    engrave: '彫刻する',
                    more: '管理する',
                    delete: '削除する',
                    reset: 'リセット',
                    sure_to_reset: 'これにより、すべてのプリセットがリセットされ、カスタマイズされた構成が保持されます。続行してもよろしいですか？',
                    apply: '適用する',
                    cancel: 'キャンセル',
                    save: '保存する',
                    name: '名前',
                    default: 'デフォルト',
                    customized: 'カスタマイズされたリスト',
                    inuse: '使用中',
                    export_config: 'パラメータのエクスポート',
                    sure_to_load_config: 'これにより、プリセットの配置が読み込まれ、ファイルに設定されているカスタマイズされたパラメーターが置き換えられます。続行しますか？',
                    dropdown: {
                        mm: {
                            wood_3mm_cutting: '木材 - 3mm 切断',
                            wood_5mm_cutting: '木材 - 5mm 切断',
                            wood_bw_engraving: '木材 - モノクロ彫刻',
                            wood_shading_engraving: '木材 - シェーディング彫刻',
                            acrylic_3mm_cutting: 'アクリル - 3mm 切断',
                            acrylic_5mm_cutting: 'アクリル - 5mm 切断',
                            acrylic_bw_engraving: 'アクリル - モノクロ彫刻',
                            acrylic_shading_engraving: 'アクリル - チェーディング彫刻',
                            leather_3mm_cutting: 'レザー - 3mm 切断',
                            leather_5mm_cutting: 'レザー - 5mm 切断',
                            leather_bw_engraving: 'レザー - モノクロ彫刻',
                            leather_shading_engraving: 'レザー - シェーディング彫刻',
                            fabric_3mm_cutting: '布地 - 3mm 切断',
                            fabric_5mm_cutting: '布地 - 5mm 切断',
                            fabric_bw_engraving: '布地 - モノクロ彫刻',
                            fabric_shading_engraving: '布地 - シェーディング彫刻',
                            rubber_bw_engraving: 'ゴム - モノクロ彫刻',
                            glass_bw_engraving:  'ガラス - モノクロ彫刻',
                            metal_bw_engraving: '金属 - モノクロ彫刻',
                            stainless_steel_bw_engraving_diode: '金属 - モノクロ彫刻 (ダイオードレーザー)',
                            save: '保存する',
                            export: '書き出す',
                            more: '管理する',
                            parameters: 'パラメーター…'
                        },
                        inches: {
                            wood_3mm_cutting: '木材 - 0.1\'\' 切断',
                            wood_5mm_cutting: '木材 - 0.2\'\' 切断',
                            wood_bw_engraving: '木材 - モノクロ彫刻',
                            wood_shading_engraving: '木材 - シェーディング彫刻',
                            acrylic_3mm_cutting: 'アクリル - 0.1\'\' 切断',
                            acrylic_5mm_cutting: 'アクリル - 0.2\'\' 切断',
                            acrylic_bw_engraving: 'アクリル - モノクロ彫刻',
                            acrylic_shading_engraving: 'アクリル - チェーディング彫刻',
                            leather_3mm_cutting: 'レザー - 0.1\'\' 切断',
                            leather_5mm_cutting: 'レザー - 0.2\'\' 切断',
                            leather_bw_engraving: 'レザー - モノクロ彫刻',
                            leather_shading_engraving: 'レザー - シェーディング彫刻',
                            fabric_3mm_cutting: '布地 - 0.1\'\' 切断',
                            fabric_5mm_cutting: '布地 - 0.2\'\' 切断',
                            fabric_bw_engraving: '布地 - モノクロ彫刻',
                            fabric_shading_engraving: '布地 - シェーディング彫刻',
                            rubber_bw_engraving: 'ゴム - モノクロ彫刻',
                            glass_bw_engraving:  'ガラス - モノクロ彫刻',
                            metal_bw_engraving: '金属 - モノクロ彫刻',
                            stainless_steel_bw_engraving_diode: '金属 - モノクロ彫刻 (ダイオードレーザー)',
                            save: '保存する',
                            export: '書き出す',
                            more: '管理する',
                            parameters: 'パラメーター…'
                        }
                    },
                    laser_speed: {
                        text: 'レーザー速度',
                        unit: 'mm/秒',
                        fast: '高速',
                        slow: '低速',
                        min: 3,
                        max: 300,
                        step: 0.1
                    },
                    power: {
                        text: '出力',
                        high: '高',
                        low: '低',
                        min: 1,
                        max: 100,
                        step: 0.1
                    },
                    para_in_use: 'このパラメーターは使用中です。',
                    do_not_adjust_default_para: 'デフォルトのパラメーターは調整できません。',
                    existing_name: 'このパラメーター名は使用されています。'
                },
                object_panel: {
                    zoom: 'ズーム',
                    group: 'グループ化',
                    ungroup: 'グループ化解除',
                    halign: '水平配置',
                    valign: '垂直配置',
                    hdist: '左右に整列',
                    vdist: '上下に整列',
                    left_align: '左に整列',
                    center_align: '中央に整列',
                    right_align: '右に整列',
                    top_align: '上部に整列',
                    middle_align: '中間に整列',
                    bottom_align: '下部に整列',
                    union: 'ユニオン',
                    subtract: '引く',
                    intersect: '交差',
                    difference: '差',
                    hflip: '左右反転',
                    vflip: '上下反転',
                    option_panel: {
                        fill: 'インフィル',
                        rounded_corner: '角丸',
                        font_family: 'フォント',
                        font_style: 'スタイル',
                        font_size: 'サイズ',
                        letter_spacing: '文字間隔',
                        line_spacing: '行間',
                        vertical_text: '縦書き',
                        shading: 'シェーディング',
                        threshold: 'しきい値',
                    },
                    actions_panel: {
                        replace_with: '置き換える',
                        trace: 'ベクター化',
                        grading: 'カーブ',
                        sharpen: 'シャープ化',
                        crop: 'クロップ',
                        bevel: '面取りを生成',
                        invert: '色を反転',
                        convert_to_path: 'パスに変換',
                        wait_for_parsing_font: 'フォントの解析中です… 少々お待ちください',
                        offset: 'オフセット',
                        array: '配列',
                        decompose_path: '離散パスを分解する',
                        disassemble_use: '逆アセンブル',
                    }
                },
            },
            bottom_right_panel: {
                convert_text_to_path_before_export: 'テキストをパスに変換…',
                retreive_image_data: '画像データを読み出す…',
                export_file_error_ask_for_upload: 'Failed to export task. Are you willing to provide working scene to develop team for bug report?',
            },
            image_trace_panel: {
                apply: '適用する',
                back: '戻る',
                cancel: 'キャンセル',
                next: '次へ',
                brightness: '輝度',
                contrast: 'コントラスト',
                threshold: 'しきい値',
                okay: '分かりました',
                tuning: 'パラメーター'
            },
            photo_edit_panel: {
                apply: '適用する',
                back: '戻る',
                cancel: 'キャンセル',
                next: '次へ',
                sharpen: 'シャープにする',
                sharpness: 'シャープネス',
                crop: '切り抜き',
                curve: '曲線',
                start: '開始',
                processing: '処理中',
                invert: '色を反転',
                okay: '分かりました',
                phote_edit: '写真編集'
            },
            document_panel: {
                document_settings: 'ドキュメント設定',
                engrave_parameters: '彫刻パラメーター',
                workarea: '作業領域',
                rotary_mode: 'ロータリー',
                borderless_mode: 'ボーダーレスモード',
                engrave_dpi: '解像度',
                enable_diode: 'ハイブリッドレーザー',
                enable_autofocus: 'オートフォーカス',
                add_on: 'アドオン',
                low: '低',
                medium: '中',
                high: '高',
                ultra: '超高',
                enable: '有効',
                disable: '無効',
                cancel: 'キャンセル',
                save: '保存する'
            },
            object_panels: {
                position: '位置',
                rotation: '回転',
                size: 'サイズ',
                width: '幅　',
                height: '高さ',
                center: '中心',
                ellipse_radius: 'サイズ',
                rounded_corner: '角丸',
                radius: '半径',
                points: 'ポイント',
                length: 'Length',
                text: 'テキスト',
                font_size: 'サイズ',
                fill: 'インフィル',
                letter_spacing: '文字間隔',
                line_spacing: '行間',
                vertical_text: '縦書き',
                convert_to_path: 'パスに変換',
                convert_to_path_to_get_precise_result: '一部のフォントは正しく解析できません。Beamboxに提出する前にテキストをパスに変換してください',
                wait_for_parsing_font: 'フォントの解析中です… 少々お待ちください',
                text_to_path: {
                    font_substitute_pop: 'テキスト：「%s」に書体：「%s」サポートできない文字があります.\n%s\n書体「%s」に変更して宜しいですか',
                    check_thumbnail_warning: 'テキストをパスに解析するときに一部の書体が他のフォントに変更され、一部の文字が正常に変換されないことがあります.\nタスクを送信する前に、プレビュー画像をもう一度確認してください。'
                },
                laser_config: 'レーザー設定',
                shading: 'シェーディング',
                threshold: 'しきい値',
                lock_desc: '幅と高さの比率を保持（SHIFT）'
            },
            tool_panels:{
                cancel: 'キャンセル',
                confirm: '確認する',
                grid_array: 'グリッド配列を作成',
                array_dimension: '配列の次元',
                rows: '行',
                columns: '列',
                array_interval: '配列の間隔',
                dx: 'X',
                dy: 'Y',
                offset: 'オフセット',
                nest: '整列の最適化',
                _offset: {
                    direction: 'オフセット方向',
                    inward: '内向き',
                    outward: '外向き',
                    dist: 'オフセット距離',
                    corner_type: 'コーナー',
                    sharp: 'シャープ',
                    round: 'ラウンド',
                    fail_message: 'オブジェクトのオフセットに失敗しました。',
                    not_support_message: 'サポートされていないSVGタグを含む選択された要素：\n&lt;image&gt;, &lt;g&gt;, &lt;text&gt;, &lt;use&gt;\nこれらのオブジェクトはスキップされます。',
                },
                _nest: {
                    start_nest: '整列開始',
                    stop_nest: '整列停止',
                    end: '終了する',
                    spacing: '間隔',
                    rotations: 'Possible Rotation',
                    no_element: '整列できるオブジェクトがありません',
                }
            },
            network_testing_panel: {
                network_testing: 'ネットワーク試験',
                local_ip: 'ローカルIPアドレス：',
                insert_ip: 'ターゲットデバイスのIPアドレス：',
                empty_ip: '#818 最初にターゲットデバイスのIPを入力してください。',
                start: '開始',
                end: '終了',
                testing: 'ネットワークの試験中…',
                invalid_ip: '#818 無効なIPアドレス',
                network_healthiness: 'ネットワークの健全性',
                average_response: '平均応答時間',
                test_completed: 'テストが完了しました',
                test_fail: 'テストに失敗しました',
                cannot_connect_1: 'ターゲットIPに接続することができません。',
                cannot_connect_2: 'ターゲットIPに接続することができません。ターゲットが同じネットワークにあることを確認してください。',
                cannot_get_local: 'ローカルIPアドレスへのアクセスに失敗しました。',
                fail_to_start_network_test: '#817 ネットワーク試験を開始できません。'
            },
            layer_color_config_panel: {
                layer_color_config: 'レイヤーの色設定',
                color: '色',
                power: '出力',
                speed: '速度',
                repeat: '実行',
                add: '追加する',
                save: '保存する',
                cancel: 'キャンセルする',
                default: 'デフォルトにリセット',
                add_config: '色を追加',
                in_use: 'この色は使用中です。',
                no_input: '16進数の有効なカラーコードを入力してください。',
                sure_to_reset: 'カスタマイズされたパラメータはすべて失われます。本当にデフォルトにリセットしますか？',
                sure_to_delete: 'この色の設定を削除してもよろしいですか？'
            },
            svg_editor: {
                unnsupported_file_type: 'ファイルタイプは直接サポートされていません。ファイルをSVGまたはビットマップに変換してください',
                unnsupport_ai_file_directly: '最初にAlファイルをSVGまたはビットマップに変換してください。',
                unable_to_fetch_clipboard_img: '画像をクリップボードから転送失敗しました。',
            },
            units: {
                walt: 'W',
                mm: 'mm'
            }
        },
        select_printer: {
            choose_printer: 'マシンを選択',
            notification: '「%s」は、パスワードが必要です',
            submit: '提出する',
            please_enter_password: 'パスワード',
            auth_failure: '#811 認証失敗',
            retry: '再試行',
            unable_to_connect: '#810 マシンとの安定した接続を構築できません'
        },
        device: {
            pause: '一時停止',
            paused: '一時停止中',
            pausing: '一時停止処理中',
            select_printer: 'プリンターを選択',
            retry: '再試行',
            status: 'ステータス',
            busy: 'ビジー',
            ready: '準備完了',
            reset: 'リセット（Kick）',
            abort: 'アボート',
            start: '開始',
            please_wait: 'お待ちください…',
            quit: '終了する',
            heating: '加熱',
            completing: '完了処理中',
            aborted: 'アボートしました',
            completed: '完了済み',
            calibrating: '較正中',
            showOutline: 'フレーム表示',
            aborting: 'アボート処理中',
            starting: '開始処理中',
            preparing: '準備中',
            resuming: '再開中',
            scanning: 'スキャン中',
            occupied: '維持中',
            running: '作業中',
            uploading: 'アップロード中',
            processing: '処理中',
            disconnectedError: {
                caption: 'マシンが切断されました',
                message: '%sのネットワークアクセスが利用可能かどうか確認してください'
            },
            noTask: '現在、実行するタスクはありません',
            pleaseWait: 'お待ちください…',
            finishing: '終了しています',
            initiating: '初期化中',
            unknown: '不明',
            pausedFromError: 'エラーにより一時停止しました',
            model_name: 'モデル名',
            IP: 'IP',
            serial_number: 'シリアル番号',
            firmware_version: 'ファームウェアバージョン',
            UUID: 'UUID',
            select: '選択する',
            deviceList: 'マシンリスト',
            calibration: {
                title: '自動較正',
                A: 'レベリングと高さ',
                H: '高さのみ',
                N: 'オフ',
                byFile: 'ファイル別'
            },
            detectFilament: {
                title: 'フィラメント検出',
                on: 'オン',
                off: 'オフ',
                byFile: 'ファイル別'
            },
            filterHeadError: {
                title: 'ツールヘッドエラー検出',
                shake: 'Shake（シェイク）',
                tilt: '傾斜',
                fan_failure: 'ファン障害',
                laser_down: 'レーザーインターロック',
                byFile: 'ファイル別',
                no: 'いいえ'
            },
            autoresume: {
                title: 'スマートタスクの継続',
                on: 'オン',
                off: 'オフ'
            },
            broadcast: {
                title: 'UPNPブロードキャスト',
                L: 'デフォルト',
                A: 'アクティブ',
                N: 'いいえ'
            },
            enableCloud: {
                title: 'クラウドを有効にする',
                A: 'アクティブ',
                N: 'いいえ'
            },
            backlash: '幾何学的誤差修正',
            turn_on_head_temperature: 'ツールヘッド温度を設定',
            plus_camera: 'キットカメラをアップグレード',
            plus_extrusion: 'キット押出機をアップグレード',
            postback_url: 'ステータスコールバックURL',
            movement_test: '印刷前の動作テスト',
            machine_radius: 'デルタ半径',
            disable: '無効にする',
            enable: '有効にする',
            beambox_should_use_touch_panel_to_adjust: 'Beamboxの設定は、Beamboxのタッチパネルから調整する必要があります。'
        },
        monitor: {
            change_filament                     : 'フィラメントを変更',
            browse_file                         : 'ファイルを閲覧',
            monitor                             : 'モニター',
            currentTemperature                  : '現在の温度',
            nothingToPrint                      : '印刷するものがありません',
            go                                  : '開始',
            start                               : '開始',
            pause                               : '一時停止',
            stop                                : '停止',
            record                              : '記録',
            camera                              : 'カメラ',
            connecting                          : '接続しています。お待ちください…',
            HEAD_OFFLINE                        : '#110 ツールヘッドが検出されませんでした\nツールヘッドケーブルが正しく接続されていることを確認してください<a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218183157">さらなる情報</a>',
            HEAD_ERROR_CALIBRATING              : '#112 ツールヘッドの内部ジャイロを較正できません\nツールヘッドを再度取り付けてください',
            HEAD_ERROR_FAN_FAILURE              : '#113 冷却ファンの故障\n鉛筆または細い棒でファンをやさしく回してください。 <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/217732178">さらなる情報</a>',
            HEAD_ERROR_HEAD_OFFLINE             : '#110 ツールヘッドが検出されませんでした\nツールヘッドケーブルが正しく接続されていることを確認してください<a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218183157">さらなる情報</a>',
            HEAD_ERROR_TYPE_ERROR               : '#111 ツールヘッドが正しくありません\n正しいツールヘッドを取り付けてください',
            HEAD_ERROR_INTLK_TRIG               : '#116 彫刻ツールヘッドの傾きが検出されました \nロッドが正しく接続されていることを確保してください。 <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/217085937">さらなる情報</a>',
            HEAD_ERROR_RESET                    : '#114 ツールヘッドの接続不良\nツールヘッドが正しく接続されていることを確認してください。1回の印刷でこのエラーが2度発生した場合は、サポートにご連絡ください。 <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218183167">さらなる情報</a>',
            HEAD_ERROR_TILT                     : '#162 ツールヘッドの傾きが検出されました\nボールジョイントロッドが正しく取り付けられていることを確認してください',
            HEAD_ERROR_SHAKE                    : '#162 ツールヘッドの傾きが検出されました\nボールジョイントロッドが正しく取り付けられていることを確認してください',
            HEAD_ERROR_HARDWARE_FAILURE         : '#164 ツールヘッドの異常温度が検出されました\nFLUXサポートにお問い合わせください <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218415378">さらなる情報</a>',
            'HEAD_ERROR_?'                      : '#199 ツールヘッドエラー \nツールヘッドに異常がないかどうかを確認してください',
            HARDWARE_ERROR_FILAMENT_RUNOUT      : '#121 フィラメントが検出されませんでした \n新しい材料を挿入してください <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218931757">さらなる情報</a>',
            HARDWARE_ERROR_0                    : '#121 フィラメントが検出されませんでした \n新しい材料を挿入してください <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218931757">さらなる情報</a>',
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
            USER_OPERATION_FROM_CODE            : '作業のため一時停止中（フィラメントの変更）',
            processing                          : '処理中',
            savingPreview                       : 'サムネイルの生成中',
            hour                                : 'h',
            minute                              : 'm',
            second                              : 's',
            left                                : '左',
            temperature                         : '温度',
            forceStop                           : '現在のタスクをアボートしますか？',
            upload                              : 'アップロード',
            download                            : 'ダウンロード',
            relocate                            : '再配置',
            cancel                              : 'キャンセル',
            prepareRelocate                     : '再配置の準備',
            fileNotDownloadable                 : 'このファイルはタイプは、ダウンロードに対応していません',
            cannotPreview                       : 'このファイル形式をプレビューできません',
            extensionNotSupported               : 'このファイル形式はサポートされていません',
            fileExistContinue                   : 'ファイルはすでに存在します。ファイルを置き換えますか？',
            confirmGToF                         : 'GCodeは、FCodeに変換されます。続行しますか？（存在する場合は、置き換えられます）',
            updatePrintPresetSetting            : 'FLUX Studioには新しいデフォルトの印刷パラメーターがあります。アップデートしますか？\n（現在の設定は上書きされます）',
            confirmFileDelete                   : 'このファイルを削除してもよろしいですか？',
            task: {
                EXTRUDER                        : '印刷',
                PRINT                           : '印刷',
                LASER                           : 'レーザー彫刻',
                DRAW                            : 'デジタルド描画',
                CUT                             : 'ビニール切断',
                VINYL                           : 'ビニール切断',
                BEAMBOX                         : 'レーザー彫刻',
                'N/A'                           : 'フリーモード'
            },
            device: {
                EXTRUDER                        : '印刷ツールヘッド',
                LASER                           : '彫刻ツールヘッド',
                DRAW                            : '描画ツールヘッド'
            },
            cant_get_toolhead_version           : 'ツールヘッド情報を取得できません'
        },
        alert: {
            caption: 'エラー',
            duplicated_preset_name: '重複したプリセット名',
            info: '情報',
            warning: '警告',
            error: 'おっと',
            retry: '再試行',
            abort: 'アボート',
            confirm: '確認する',
            cancel: 'キャンセル',
            close: '閉じる',
            ok: 'OK',
            ok2: 'はい',
            yes: 'はい',
            no: 'いいえ',
            stop: '停止',
            save: '保存する',
            dont_save: '保存しない'
        },
        caption: {
            connectionTimeout: '接続タイムアウト'
        },
        message: {
            connecting: '接続中…',
            connectingMachine: '%sを接続しています…',
            tryingToConenctMachine: 'マシンに接続しようとしています…',
            connected: '接続済み',
            authenticating: '認証中…',
            runningTests: 'テストの実行中…',
            machineNotConnected: 'マシンが接続されていません',
            notPrinting: '印刷中ではありません',
            nothingToPrint: '印刷するものがありません（ソースBLOBがありません）',
            connectionTimeout: '#805 ネットワークの状態とマシンのWi-Fiインジケーターを確認してください。',
            device_not_found: {
                caption: '出るフォトのマシンが見つかりません',
                message: '#812 マシンのWi-Fiインジケーターを確認してください'
            },
            device_busy: {
                caption: 'マシンビジー状態',
                message: 'マシンは別のタスクを実行しています。後で再試行してください。動作しなくなった場合は、マシンを再起動してください。'
            },
            device_is_used: 'マシンは使用中です。現在のタスクをアボートしますか？',
            device_in_use: 'マシンは使用中です。現在のタスクを停止または一時停止してください。',
            invalidFile: 'ファイルは有効なSTLファイルではありません',
            failGeneratingPreview: 'プレビューを生成することができません',
            slicingFailed: 'slic3rはこのモデルをスライスできません',
            no_password: {
                content: 'このコンピューターの接続を有効にするには、USB経由でマシンパスワードを設定します',
                caption: 'パスワードが設定されていません'
            },
            image_is_too_small: 'ファイルにサポートされていない情報が含まれています',
            monitor_too_old: {
                caption: '古いファームウェア',
                content: '#814 <a target="_blank" href="http://helpcenter.flux3dp.com/hc/en-us/articles/216251077">このガイド</a>を使って、最新のファームウェアをインストールしてください。'
            },
            cant_establish_connection: 'FLUX Studio APIに接続できません。<a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/requests/new" target="_blank">FLUXサポートにご連絡ください。</a>',
            application_occurs_error: 'アプリケーションで未処理のエラーが発生しました。',
            error_log: 'エラーログ',
            fcodeForLaser: 'これは彫刻用のFCodeです',
            fcodeForPen: 'これは描画用のFCodeです',
            confirmFCodeImport: 'FCodeをインポートすると、シーン上のすべてのオブジェクトが削除されます。よろしいですか？',
            confirmSceneImport: '.fscをインポートすると、シーン上のすべてのオブジェクトが削除されます。よろしいですか？',
            brokenFcode: '%sを開けません',
            slicingFatalError: 'スライス中にエラーが発生しました。STLファイルをカスタマーサポートに報告してください。',
            unknown_error: '#821 アプリケーションで不明なエラーが発生しました。[ヘルプ]>[メニュー]>[バグレポート]を使用してください。',
            unknown_device: '#826 マシンに接続できません。USBがマシンに接続されていることを確認してください',
            important_update: {
                caption: '重要なアップデート',
                message: '重要なマシンファームウェアのアップデートが利用可能です。今すぐアップデートしますか？',
            },
            unsupport_osx_version: 'サポートされていないMac OS Xバージョンが検出されました',
            need_password: 'マシンに接続するには、パスワードが必要です',
            unavailableWorkarea: '#804 セットした作業領域がマシンの作業領域を超えます。マシンの作業領域を確認や[編集]>[ドキュメント設定]で作業領域をセットくださいい。',
            new_app_downloading: 'FLUX Studioがダウンロードしています',
            new_app_download_canceled: 'FLUX Studioのダウンロードがキャンセルされました',
            new_app_downloaded: '最新のFLUX Studioがダウンロードされました',
            ask_for_upgrade: '今すぐアップグレードしますか？',
            please_enter_dpi: 'ファイルの単位を入力してください',
            reset_sd_card: '#820 マシンのSDカードをリセットしてください',
            gcode_area_too_big: 'インポートされたGCodeは、印刷可能領域を超えています。',
            empty_file: 'ファイルが空です',
            usb_unplugged: 'USB接続が失われました。USB接続を確認してください。',
            launghing_from_installer_warning: 'あなたはインストーラーからFLUX Studioを起動していますが、これにより問題が発生する可能性があります。FLUX Studioをアプリケーションフォルダーに移動してください。',
            uploading_fcode: 'FCodeのアップロード中',
            cant_connect_to_device: '#827 マシンを接続できません。接続を確認してください',
            unable_to_find_machine: 'マシンを見つけることができません',
            unable_to_start: '#830 タスクを開始することができません。これが再び起きた場合は、バグレポートでご連絡ください：\n',
            camera_fail_to_transmit_image: '画像の送信に不具合が発生しました。Beamboxを再起動するか、ご連絡ください。'
        },
        machine_status: {
            '-10': '維持モード',
            '-2': 'スキャン中',
            '-1': '維持中',
            0: 'アイドル状態',
            1: '初期化中',
            2: 'ST_TRANSFORM',
            4: '開始処理中',
            6: '再開中',
            16: '作業中',
            18: '再開中',
            32: '一時停止中',
            36: '一時停止中',
            38: '一時停止処理中',
            48: '一時停止中',
            50: '一時停止処理中',
            64: '完了済み',
            66: '完了処理中',
            68: '準備中',
            128: 'アボートしました',
            UNKNOWN: '不明'
        },
        head_module: {
            EXTRUDER: '印刷する',
            LASER: 'レーザー',
            UNKNOWN: '',
            error: {
                'missing': 'エラー情報がありません',
                '0': '不明なモジュール',
                '1': 'センサー通信障害',
                '2': 'No hello', // pi will send head_error_reset before this is issued
                '3': '#112 ツールヘッドの内部ジャイロを較正できません\nツールヘッドを再度取り付けてください',
                '4': '#162 ツールヘッドの傾きが検出されました\nボールジョイントロッドが正しく取り付けられていることを確認してください',
                '5': '#162 ツールヘッドの傾きが検出されました\nボールジョイントロッドが正しく取り付けられていることを確認してください',
                '6': '#119 プリンターツールヘッドが温度を制御できません。FLUXサポートにご連絡ください。',
                '7': '#113 冷却ファンの故障\n鉛筆または細い棒でファンをやさしく回してください。 <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/217732178">さらなる情報</a>',
                '8': '#116 彫刻ツールヘッドの傾きが検出されました\nロッドが正しく接続されていることを確保してください。 <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/217085937">さらなる情報</a>',
                '9': '#118 プリンターのツールヘッドを加熱できません\nFLUXサポートにご連絡ください。'
            }
        },
        change_filament: {
            home_caption: 'フィラメントを変更',
            load_filament_caption: 'ロードする',
            load_flexible_filament_caption: '柔軟なロード',
            unload_filament_caption: 'アンロードする',
            cancel: 'キャンセル',
            load_filament: 'フィラメントをロードする',
            load_flexible_filament: '柔軟なフィラメントをロードする',
            unload_filament: 'フィラメントをアンロードする',
            next: '次へ',
            heating_nozzle: '加熱ノズル',
            unloading: 'フィラメントのアンロード中',
            loaded: 'フィラメントをロードしました',
            unloaded: 'フィラメントをアンロードしました',
            ok: 'OK',
            kicked: 'はキックされました',
            auto_emerging: 'フィラメントを挿入してください',
            loading_filament: 'フィラメントのロード中',
            maintain_head_type_error: 'ツールヘッドが正しくインストールされていません',
            disconnected: '接続が不安定です。デバイスの接続を確認して、後で再試行してください',
            maintain_zombie: 'マシンを再起動してください',
            toolhead_no_response: '#117 モジュールが応答しません <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218347477">詳細</a>',
            NA: 'ツールヘッドが接続されていません'
        },
        head_temperature: {
            title: 'ツールヘッドの温度を設定',
            done: '終了する',
            target_temperature: '目標温度',
            current_temperature: '現在の温度',
            set: '設定する',
            incorrect_toolhead: 'ツールヘッドが正しくありません。印刷ツールヘッドを使用してください',
            attach_toolhead: '印刷ツールヘッドを接続してください'
        },
        camera_calibration: {
            update_firmware_msg1: 'ファームウェアはこの機能をサポートしていません。ファームウェアを v',
            update_firmware_msg2: 'またはそれ以上にアップデートして。続行してください。（メニュー > マシン > [お使いのマシン] >ファームウェアのアップデート）',
            camera_calibration: 'カメラの較正',
            next: '次へ',
            cancel: 'キャンセル',
            back: '戻る',
            finish: '完了済み',
            please_goto_beambox_first: 'この機能を使用するには、彫刻モード（Beambox）に切り替えてください。',
            please_place_paper: {
                beambox: 'ワークエリアの左上隅にA4またはレターサイズの白い用紙を置いてください',
                beamo: 'ワークエリアの左上隅にA4またはレターサイズの白い用紙を置いてください',
            },
            please_refocus: {
                beambox: 'プラットフォームを焦点に合わせてください（折り返されたアクリルの高さ）',
                beamo: 'レーザーヘッドを調整して、彫刻オブジェクトに焦点を合わせます（折り返されたアクリルの高さ'
            },
            dx: 'X',
            dy: 'Y',
            rotation_angle: '回転',
            x_ratio: 'X比',
            y_ratio: 'Y比',
            show_last_config: '前回の結果を表示',
            hide_last_config: '前回の結果を非表示',
            taking_picture: '写真撮影中…',
            start_engrave: '彫刻開始',
            analyze_result_fail: 'キャプチャした画像を分析することができません。<br/>次のことを確認してください：<br/>1. キャプチャした画像が白い紙で完全に覆われている。<br/>2. プラットフォームは適切にフォーカスされている。',
            no_lines_detected: 'キャプチャした画像からラインを検出することができません。<br/>次のことを確認してください：<br/>1. キャプチャした写真が白い紙で完全に覆われている。<br/>2. プラットフォームは適切にフォーカスされている。',
            drawing_calibration_image: '較正画像の描画中…',
            please_confirm_image: '<div><div class="img-center" style="background:url(%s)"></div></div>次のことを確認してください：<br/>1. キャプチャした写真が白い紙で完全に覆われている。<br/>2. プラットフォームは適切にフォーカスされている。',
            calibrate_done: '較正が完了しました。正確に焦点を合わせると、カメラの精度が向上します。',
            hint_red_square: '赤い正方形をカットした正方形に合わせてください',
            hint_adjust_parameters: 'これらのパラメーターを使用して、赤い正方形を調整します'
        },
        diode_calibration: {
            update_firmware_msg1: 'ファームウェアはこの機能をサポートしていません。ファームウェアを v',
            update_firmware_msg2: 'またはそれ以上にアップデートして。続行してください。（メニュー > マシン > [お使いのマシン] >ファームウェアのアップデート）',
            diode_calibration: 'ハイブリッドレーザーモジュールの較正',
            next: '次へ',
            cancel: 'キャンセル',
            back: '戻る',
            start_engrave: '彫刻開始',
            finish: '完了済み',
            please_refocus: {
                beambox: 'プラットフォームを焦点に合わせてください（折り返されたアクリルの高さ）',
                beamo: 'レーザーヘッドを調整して、彫刻オブジェクトに焦点を合わせます（折り返されたアクリルの高さ'
            },
            please_place_paper: {
                beambox: 'ワークエリアの左上隅にA4またはレターサイズの白い用紙を置いてください',
                beamo: 'ワークエリアの左上隅にA4またはレターサイズの白い用紙を置いてください',
            },
            dx: 'X',
            dy: 'Y',
            drawing_calibration_image: '較正画像の描画中…',
            taking_picture: '写真撮影中…',
            calibrate_done: '較正が完了しました。ハイブリッドレーザーオフセットを保存しました。',
            hint_red_square: '赤い正方形をカットした正方形に合わせてください',
            hint_adjust_parameters: 'これらのパラメーターを使用して、赤い正方形を調整します'
        },
        input_machine_password: {
            require_password: '「%s」にはパスワードが必要です。',
            connect: '接続する',
            password: 'パスワード'
        },
        set_default: {
            success: '%sをデフォルトとして正常に設定しました',
            error: 'ネットワークの問題のため、%sをデフォルトとして設定できません'
        },
        tutorial: {
            set_first_default_caption: 'ようこそ',
            set_first_default: '「%s」をデフォルトのデバイスとして設定しますか？ ',
            startWithFilament: '今度は、フィラメントをロードします。',
            startWithModel: '次に、サンプルの3Dモデルをインポートしましょう',
            startTour: 'ようこそ！<br/>これはあなたにとって初めての印刷です、<br/>印刷のチュートリアルを開始しますか？',
            clickToImport: 'ここをクリックして3Dモデルの例をインポートします',
            selectQuality: 'お好みの品質を選択します',
            clickGo: '印刷の準備をします',
            startPrint: 'グリッドのないプレートに糊を塗り、乾くまで待ちます。その後、印刷の準備が整います。',
            skip: 'スキップ',
            startPrintDeltaPlus: '必ず磁気印刷プレートの上に置いてください。',
            runningMovementTests: '動作テストの実行中',
            connectingMachine: 'マシンへの接続中',
            movementTestFailed: { caption: '動作テストに合格できません',  message: '1. ツールヘッドケーブルが正しく伸ばされていることを確認します。<br/>2. マシンへのツールヘッドケーブルのコネクターがマシンに約半分挿入していることを確認します。<br/>3. 印刷ツールヘッドのコネクターを180度回転させてみます。<br/>4. <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/115003674128">この記事</a>をチェックしてください。<br/> もう一度試しますか？' },
            befaultTutorialWelcome: 'FLUX Delta+をご注文いただきありがとうございます！<br/><br/> このガイドは、マシンの基本設定を説明し、セットアップするのに役立ちます。<br/><br/> チュートリアルを見てみましょう！字幕をオンにしてください。<br/><br/>',
            openBrowser: 'openBrowser',
            welcome: 'ようこそ',
            needNewUserTutorial: 'Beam Studioのチュートリアルはよろしいですか？',
            needNewInterfaceTutorial: 'Beam Studioのの新しいインターフェースの紹介はよろしいですか？',
            next: '次ヘ',
            newUser: {
                draw_a_circle: '円を描く',
                drag_to_draw: 'ドラッグして描画',
                infill: 'インフィルをオンにする',
                switch_to_layer_panel: 'レイヤーパネルに切り替え',
                set_preset_engraving: 'プリセットの設定-彫刻',
                set_preset_cut: 'プリセットの設定-切断',
                add_new_layer: '新しいレイヤーを追加する',
                draw_a_rect: '長方形を描く',
                switch_to_preview_mode: 'プレビューモードに切り替え',
                preview_the_platform: 'プラットフォームをプレビューする',
                send_the_file: 'ファイルを送信',
                end_alert: 'チュートリアルを終了してもよろしいですか？',
            },
            newInterface: {
                camera_preview: 'カメラプレビュー',
                select_image_text: '選択 / 画像 / テキスト',
                basic_shapes: '基本形状',
                pen_tool: 'ペンツール',
                add_new_layer: '新しいレイヤーを追加',
                rename_by_double_click: 'ダブルクリックで名前を変更',
                drag_to_sort: 'ドラッグして並べ替える',
                layer_controls: '右クリックしてレイヤーコントロールを呼び出す:\nレイヤーの複製 / マージ / ロック / 削除',
                switch_between_layer_panel_and_object_panel: 'レイヤーパネルとオブジェクトパネルを切り替える',
                align_controls: '整列管理',
                group_controls: 'グループ管理',
                shape_operation: '形状操作',
                flip: 'フリップ',
                object_actions: 'オブジェクトアクション',
                end_alert: '新しいインターフェースの紹介を終了してもよろしいですか？',
            },
            tutorial_complete: '紹介が終わりました、作っていきましょう！',
        },
        slicer: {
            computing: 'コンピューティング',
            error: {
                '6': '計算されたツールパスは作業領域外です。オブジェクトのサイズを小さくするか、ラフト、ブリム、またはスカートをオフにしてみてください。',
                '7': '詳細パラメーターの設定中にエラーが発生しました。',
                '8': 'スライス：： APIは空の結果を返しました。\n結果のリクエストは、おそらくスライスが完了する前に呼び出されます',
                '9': 'スライス：： APIは空のパスを返しました。\nツールパスのリクエストは、おそらくスライスが完了する前に呼び出されます',
                '10': 'スライス：： オブジェクトデータがありません。ソースオブジェクトがスライサーエンジンにありません',
                '13': 'スライス：： 重複エラー\n選択されたIDは存在しません。FLUX Studioを再起動してもエラーが解決しない場合は、このエラーを報告してください。',
                '14': 'スライス：： 位置の設定中にエラーが発生しました。ソースオブジェクトがスライサーエンジンにありません。',
                '15': 'スライス：： アップロードされたファイルが壊れています。ファイルを確認して、再試行してください。',
                '16': 'スライス：： スライスエンジンが異常終了しました。もう一度スライスしてください。',
                '1006': 'WSが予期せずに終了しました。ヘルプメニューからバグレポートを入手して当社に送信してください。'
            },
            pattern_not_supported_at_100_percent_infill: 'Slic3rは、直線的なインフィルパターンを持つ100％インフィルのみをサポートします '
        },
        calibration: {
            RESOURCE_BUSY: 'マシンがアイドル状態であることを確認してください',
            headMissing: 'ヘッドモジュール情報を取得できません。情報が添付されていることを確認してください',
            calibrated: '自動レベリングが完了しました',
            extruderOnly: '較正には、印刷ツールヘッドを使用してください'
        },
        head_info: {
            ID                  : 'ID',
            VERSION             : 'ファームウェアバージョン',
            HEAD_MODULE         : 'ツールヘッドタイプ',
            EXTRUDER            : '印刷ツールヘッド',
            LASER               : '彫刻ツールヘッド',
            USED                : '使用済み',
            HARDWARE_VERSION    : 'ハードウェアバージョン',
            FOCAL_LENGTH        : '焦点距離',
            hours               : '時間',
            cannot_get_info     : 'ツールヘッドタイプが判読できません'
        }
    };
});
