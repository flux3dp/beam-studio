export default {
    general: {
        wait: '处理中，请稍待'
    },
    buttons: {
        next: '下一步'
    },
    topbar: {
        untitled: '无标题',
        titles: {
            settings: '偏好设定'
        },
        zoom: '缩放',
        group: '群组',
        ungroup: '解散群组',
        halign: '水平对齐',
        valign: '垂直对齐',
        left_align: '靠左对齐',
        center_align: '置中对齐',
        right_align: '靠右对齐',
        top_align: '顶端对齐',
        middle_align: '中线对齐',
        bottom_align: '底部对齐',
        hdist: '水平均分',
        vdist: '垂直均分',
        union: '相加',
        subtract: '相减',
        intersect: '相交',
        difference: '相异',
        hflip: '水平翻转',
        vflip: '垂直翻转',
        export: 'GO',
        preview: '相机预览',
        borderless: '(开盖模式)',
        tag_names: {
            rect: '矩形',
            ellipse: '椭圆',
            path: '路径',
            polygon: '多边形',
            image: '影像',
            text: '文本',
            line: '線段',
            g: '群组',
            multi_select: '多个物件',
            use: '汇入物件',
            svg: 'SVG 物件',
            dxf: 'DXF 物件',
        },
        alerts: {
            start_preview_timeout: '#803 启动相机预览时超时，请重新开启您的机器或是 Beam Studio ，如果此错误持续发生，请参考<a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/articles/360001111355">此则引导</a>。',
            fail_to_start_preview: '#803 启动相机预览失败，请重新开启您的机器或是 Beam Studio，如果此错误持续发生，请参考<a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/articles/360001111355">此则引导</a>。',
            power_too_high: '功率过高',
            power_too_high_msg: '激光管在高功率（70％ 以上）下耗损较快，使用低功率可以延长雷试管使用寿命。\n输入「知道了」以继续。' ,
            power_too_high_confirm: '知道了',
        },
        hint: {
            polygon: '按下 + / - 键以增加 / 减少边数。'
        },
    },
    support: {
        no_webgl: '您的系统不支持 WebGL，建议您使用其他电脑开启 Mozu Studio',
        no_vcredist: '请安装 Visual C++ Redistributable 2015<br/>可以在flux3dp.com找到',
        osx_10_9: 'Mozu Studio 目前不支持 OS X 10.9，敬请更新至更新的版本。'
    },
    generic_error: {
        UNKNOWN_ERROR: '[UE] 请重启 Mozu Studio',
        OPERATION_ERROR: '[OE] 机器发生状态冲突，请再试一次',
        SUBSYSTEM_ERROR: '[SE] 请重启机器',
        UNKNOWN_COMMAND: '[UC] 请更新机器固件',
        RESOURCE_BUSY: '[RB] 请重新启动 Delta, 或再试一次'
    },
    device_selection: {
        no_printers: '无法透过网络侦测到机器，请检查您与机器的网络连接是否在同个网络下 <a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/articles/215394548">暸解更多</a>',
        no_beambox: '#801 我们在网路上找不到您的机器，\n请参考<a target="_blank" href="https://support.flux3dp.com/hc/zh-tw/articles/360001683556">此指南</a>排除连线问题！',
        module: 'MODULE',
        status: 'STATUS'
    },
    update: {
        release_note: '版本消息:',
        firmware: {
            caption: '有新的机器固件更新',
            message_pattern_1: '"%s" 有新的固件更新。',
            message_pattern_2: '%s 固件 v%s 可使用 - 你的版本为 v%s.',
            latest_firmware: {
                caption: '固件更新',
                message: '固件已经是最新版本',
                still_update: '文件更新'
            },
            confirm: '上传',
            upload_file: '固件上传',
            update_success: '固件更新上传成功',
            update_fail: '#822 更新失败'
        },
        software: {
            checking: '检查更新中',
            switch_version: '版本切换',
            check_update: '检查更新',
            caption: 'Beam Studio 有新的软件更新',
            downloading: '正在背景下载中，您可以按确定以继续您的工作。',
            install_or_not: '已准备好更新，是否重新启动以套用更新？',
            switch_or_not: '已准备完成，是否重新启动以切换？',
            message_pattern_1: 'Beam Studio 有新的软件更新。',
            message_pattern_2: 'Beam Studio v%s 可使用 - 你的版本为 v%s.',
            available_update: 'Beam Studio v%s 现可提供下载，你的版本为 v%s，是否要下载更新？',
            available_switch: 'Beam Studio v%s 现可提供切换，你的版本为 v%s，是否要切换至此此版本？',
            not_found: 'Beam Studio 已是最新版本。',
            no_response: '无法连接到伺服器，请确认您目前的网路状态。',
            switch_version_not_found: '無法找到可切換的版本',
            yes: '是',
            no: '否',
            skip: '跳過此版本'
        },
        toolhead: {
            caption: 'FLUX 工具头有新的固件更新',
            message_pattern_1: '"%s" 有新的固件更新。',
            message_pattern_2: 'FLUX Toolhead Firmware v%s 可使用',
            latest_firmware: {
                caption: '固件更新',
                message: '固件已经是最新版本'
            },
            confirm: '上传',
            upload_file: '固件上传',
            update_success: '固件更新上传成功',
            update_fail: '更新失败',
            waiting: '请确认已安装工具头'
        },
        updating: '更新中...',
        skip: '跳过此版本',
        checkingHeadinfo: '检查工具头信息',
        preparing: '准备中...',
        later: '稍候',
        download: '在线更新',
        cannot_reach_internet: '#823 服务器无法连接<br/>请确认网络连接',
        install: '下载',
        upload: '上传'
    },
    topmenu: {
        version: '版本',
        ok: '确定',
        sure_to_quit: '确定要结束 Beam Studio?',
        flux: {
            label: 'Flux',
            about: '关于 Beam Studio',
            preferences: '偏好设置',
            quit: '结束'
        },
        file: {
            label: '文件',
            import: '导入',
            save_fcode: '导出工作',
            save_scene: '导出场景',
            save_svg: '汇出 SVG',
            save_png: '汇出 PNG',
            save_jpg: '汇出 JPG',
            converting: '转换成图片...',
            all_files: '所有文件',
            svg_files: 'SVG',
            png_files: 'PNG',
            jpg_files: 'JPG',
            bvg_files: 'Beambox 激光雕刻场景',
            fcode_files: 'FLUX Code',
            fsc_files: 'Delta 打印场景',
            confirmReset: '是否确定要重置所有设置?',
            clear_recent: '清除历史纪录',
            path_not_exit: '此路径似乎已不存在于电脑中，请确认是否有更改档案位置。'
        },
        edit: {
            label: '编辑',
            duplicate: '重制',
            rotate: '旋转',
            scale: '缩放',
            clear: '清除场景',
            undo: '复原',
            alignCenter: '置中',
            reset: '重设'
        },
        device: {
            label: '机器',
            new: '添加或设置机器',
            device_monitor: '仪表板',
            device_info: '机器信息',
            head_info: '工具头信息',
            change_filament: '更换线料',
            default_device: '设为默认',
            check_firmware_update: '固件更新',
            update_delta: '机器固件',
            update_toolhead: '工具头固件',
            calibrate: '校正平台',
            set_to_origin: '回归原点',
            movement_tests: '运行运动测试',
            scan_laser_calibrate: '打开扫描激光',
            clean_calibration: '校正平台（清除原始数据）',
            commands: '指令',
            set_to_origin_complete: '机器已回归原点',
            scan_laser_complete: '扫描激光已开启，点击 "完成" 以关闭激光',
            movement_tests_complete: '运动测试完成',
            movement_tests_failed: '运动测试失败。<br/>1. 请确工具头连接线被正确拉直<br/>2. 上盖工具头连接线接头没入约一半<br/>3. 可尝试将工具头连接线顺时针或逆时针旋转 180 度再插入<br/>4. 参考 <a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/articles/115003674128">此篇文章</a>',
            download_log: '导出机器日志',
            download_log_canceled: '取消日志下载',
            download_log_error: '不明错误发生，请稍候再试一次',
            log: {
                network: 'Network',
                hardware: 'Hardware',
                discover: 'Discover',
                usb: 'USB',
                usblist: 'USB 清单',
                camera: 'Camera',
                cloud: 'Cloud',
                player: 'Player',
                robot: 'Robot'
            },
            finish: '完成',
            cancel: '取消',
            turn_on_head_temperature: '设置打印工具头温度',
            network_test: '网路检测'
        },
        window: {
            label: '窗口',
            minimize: '最小化',
            fullscreen: '全荧幕'
        },
        help: {
            label: '说明',
            help_center: '说明中心',
            contact: '联系我们',
            tutorial: '打印教学',
            software_update: '软件更新',
            debug: '错误回报',
            forum: '社区论坛'
        },
        account: {
            label: '帐号',
            sign_in: '登录',
            sign_out: '注销'
        }
    },
    initialize: {
        // generic strings
        next: '下一步',
        start: '开始设置',
        skip: '跳过',
        cancel: '取消',
        confirm: '确认',
        connect: '连接',
        back: '返回',
        retry: '重试',
        no_machine : '目前没有机器或已设置过连接，跳过此步骤',

        // specific caption/content
        invalid_device_name: '机器名称只能使用中文，英文、数字、空格以及特殊字符 ( ) - _ ’ \'',
        require_device_name: '名称字段为必填',
        select_language: '请选择你想使用的语言',
        change_password: {
            caption: '密码更改',
            content: '确定要更改密码吗?'
        },
        connect_flux: '连接机器',
        via_usb: '使用 USB',
        via_wifi: '使用 WiFi',
        select_machine_type: '请选择您的机种',
        select_connection_type: '请选择您的连接方式',
        connection_types: {
            wifi: 'Wi-Fi',
            wired: '有线网路',
            ether_to_ether: '网路线直连',
        },
        connect_wifi: {
            title: '连接 Wi-Fi',
            tutorial1: '1. 到机器控制面板 > 点击 「网路」 > 「设定 Wi-Fi」。',
            tutorial2: '2. 选择并连接您想使用的 Wi-Fi 。',
            what_if_1: '机器找不到我想使用的 Wi-Fi',
            what_if_1_content: '1. Wi-Fi 加密方式需为 WPA2 或无密码。 \n2. 加密方式可由 Wi-Fi 路由器设定，如果路由器不支援 WPA2，可联系客服购买，如果不确定路由器是否支援，可以将型号传给客服询问。',
            what_if_2: '机器找不到任何 Wi-Fi',
            what_if_2_content: '1. 确认您的 Wi-Fi 接收器是否有着实插上。 \n2. 如果面板上没有出现无线网路硬体位置，请联系客服。 \n3. Wi-Fi 频道为 2.4Ghz (不支援 5Ghz)。',
        },
        connect_wired: {
            title: '连接有线网路',
            tutorial1: '1. 请将您的机器以乙太网路线与路由器连接。',
            tutorial2: '2. 在触控面板点击「网路」以获得有线网路 IP 。',
            what_if_1: '机器显示的有线网路 IP 是空的',
            what_if_1_content: '1. 确认您的乙太网路线是否有着实插上。 \n2. 如果面板上没有出现有线网路硬体位置，请联系客服。',
            what_if_2: '机器显示的 IP 开头为 169',
            what_if_2_content: '1. IP 地址为 169.154 开头通常为 DHCP 设定问题，需要联系网路服务提供商或是网路设定者来协助。 \n2. 如果工作环境的网路是由电脑直接 PPPoE 连网，请改由路由器直接 PPPoE 联网，并在路由器中开启DHCP 功能。'
        },
        connect_ethernet: {
            title: '网路线直连',
            tutorial1: '1. 将您的机器与您的电脑以乙太网路线连接。',
            tutorial2_1: '2. 依照',
            tutorial2_a_text: '这篇文章',
            tutorial2_a_href_mac: 'https://support.flux3dp.com/hc/zh-tw/articles/360001517076',
            tutorial2_a_href_win: 'https://support.flux3dp.com/hc/zh-tw/articles/360001507715',
            tutorial2_2: '使您的电脑同时扮演路由器的角色。',
            tutorial3: '3. 點選 下一步。',
        },
        connect_machine_ip: {
            enter_ip: '请输入机器 IP',
            check_ip: '确认 IP',
            check_firmware: '确认韧体版本',
            check_camera: '确认相机',
            retry: '重试',
            finish_setting: '结束设定'
        },
        wifi_setup: '设置无线网络',
        select_preferred_wifi: '选择你偏好的网络',
        requires_wifi_password: '需要密码',
        connecting: '连接中',
        set_connection: '设定 %s 连线',
        please_goto_touchpad: '请使用 %s 触控面板进行 WiFi 连线设定',
        tutorial: '1. 点选触控面板「网路」 > 「设定 Wi-Fi」\n2. 选取欲连线的WiFi 名称并输入密码\n3. 稍待10 秒，若于「设定」 > 「网际网路」 成功显示无线网路IP，即代表连线成功\n4. 如果没有WiFi，可以使用机器后方的乙太网路埠，路由器需开启DHCP 功能\n5. 在此输入无线或有线网路IP   ',
        please_see_tutorial_video: '观看教学影片',
        tutorial_url: 'https://tw.flux3dp.com/%s-tutorial/',
        ip_wrong: 'IP 格式错误，请重新输入',

        set_machine_generic: {
            printer_name: '机器名称*',
            printer_name_placeholder: '例如：霹雳五号',
            old_password: '旧密码',
            password: '机器密码',
            set_station_mode: '设置成无线基地台',
            password_placeholder: '使用密码保护你的机器',
            incorrect_old_password: '旧密码错误',
            incorrect_password: '#828 密码错误',
            ap_mode_name: '网络名称',
            ap_mode_pass: '密码',
            ap_mode_name_format: '只接受英文及数字',
            ap_mode_pass_format: '请至少输入 8 个字',
            ap_mode_name_placeholder: '最多 32 个字',
            ap_mode_pass_placeholder: '至少 8 个字',
            create_network: '创建网络',
            join_network: '加入网络',
            security: '安全层级'
        },

        setting_completed: {
            start: '开始使用',
            is_ready: '“%s” 准备完成',
            station_ready_statement: '你的机器已成为 Wi-Fi 热点，你可以借由无线连接 “%s” 这个热点操作 FLUX',
            brilliant: '太棒了!',
            begin_journey: '你可以拔除 USB / Micro USB 传输线, 开始使用机器随心所欲地进行创作啰！',
            great: '欢迎使用 Beam Studio',
            setup_later: '您可以随时从选单 >「机器」>「新增或设定机器」来设定连线。',
            upload_via_usb: '你可以稍后再设置 Wi-Fi 选项。<br/>如果你没有 Wi-Fi 环境，请参考<a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/articles/215998327-Connection-Guide-for-Desktop-PCs">PC连接指南</a>',
            back: '回到 Wi-Fi 设置',
            ok: '开始使用'
        },

        notice_from_device: {
            headline: '检查 WiFi 指示灯',
            subtitle: '机器上的绿灯表示了机器的连接状态',
            light_on: 'Light On: 绿灯恒亮',
            light_on_desc: '机器已经连上了指定网络',
            breathing: 'Breathing: 呼吸灯',
            breathing_desc: '无线网络设置失败，请尝试重新设置',
            successfully: '如果机器连接成功',
            successfully_statement: '请将无线网络连接至(%s)，并且重新启动 Mozu Studio',
            restart: '重启 Mozu Studio'
        },

        // errors
        errors: {
            error: '错误',
            close: '关闭',
            not_found: '无法找到机器',
            not_support: '请透过随身碟更新 Delta 固件到 v1.6 以上',

            keep_connect: {
                caption: '无法透过 USB 连接',
                content: '别担心！请确认\n1. WiFi 指示灯（绿灯）呼吸、闪烁或恒亮\n2. 设备管理员有 FLUX Link Cable，可查看 <a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/articles/215327328">说明</a>\n3. 重新插拔线并稍等 10 秒钟'
            },

            wifi_connection: {
                caption: '无法与此 Wi-Fi 连接',
                connecting_fail: '请确认信号强度以及密码正确'
            },

            select_wifi: {
                ap_mode_fail: '基地台模式连接设置失败'
            }
        }
    },
    wifi: {
        home: {
            line1: '请问你所处的环境拥有可以连接的 Wi-Fi 吗?',
            line2: '我们将协助你将 FLUX 连接至你家中的 Wi-Fi',
            select: '是的，开始连接'
        },
        set_password: {
            line1: '请输入“',
            line2: '”无线网络的连接密码',
            password_placeholder: '请输入 Wi-Fi 密码',
            back: '上一步',
            join: '加入',
            connecting: '连接中'
        },
        success: {
            caption: '太棒了，连接成功!',
            line1: '接下来，我们将为你的机器做一些简单的设置。',
            next: '下一步'
        },
        failure: {
            caption: '连接失败',
            line1: '请确认你的 Wi-Fi 是否正常运作后，再重新连接',
            next: '重新连接'
        },
        set_printer: {
            caption: '为你的 FLUX3D Printer 设置名称与密码',
            printer_name: '名称',
            printer_name_placeholder: '设置名称',
            password: '密码',
            password_placeholder: '设置密码',
            notice: '设置密码，可以确保你的 FLUX 只有知道密码的人可以操作',
            next: '下一步'
        }
    },
    menu: {
        print: '打印',
        laser: '雷雕',
        scan: '扫描',
        usb: 'USB',
        device: '机器',
        setting: '设置',
        draw: '绘图',
        cut: '切割',
        beambox: 'BEAMBOX',
        mill: 'MILL',
        mm: '毫米',
        inches: '英吋'
    },
    settings: {
        on: '开',
        off: '关',
        low: '低',
        high: '正常',
        caption: '设置',
        tabs: {
            general: '一般',
            device: '机器'
        },
        ip: '机器 IP 位址',
        guess_poke: '自动搜寻机器 IP',
        auto_connect: '自动选择唯一机器',
        wrong_ip_format: 'IP格式错误',
        lock_selection: '锁定选取目标',
        reset: '重置所有设置',
        default_machine: '默认机器',
        default_machine_button: '无',
        remove_default_machine_button: '删除',
        confirm_remove_default: '将会删除默认机器',
        reset_now: '重置所有设置',
        confirm_reset: '确认要重置 Beam Studio?',
        language: '语言',
        notifications: '显示桌面通知',
        check_updates: '自动检查',
        updates_version: '版本',
        default_app: '默认功能',
        default_units: '预设单位',
        default_font_family: '预设字体',
        default_font_style: '预设字型',
        fast_gradient: '速度优化',
        vector_speed_constraint: '限制上限速度 (20 mm/s)',
        loop_compensation: '封闭路径补偿',
        blade_radius: '旋转刀半径',
        blade_precut_switch: '旋转刀预切',
        blade_precut_position: '预切位置',
        beambox_series: 'Beambox 系列',
        default_model: '默认型号（打印参数）',
        default_beambox_model: '预设文件设定',
        guides_origin: '参考线座标',
        guides: '参考线',
        image_downsampling: '点阵图预览品质',
        continuous_drawing: '连续绘制',
        mask: '工作范围剪裁',
        text_path_calc_optimization: '路径计算优化',
        font_substitute: '自动替换字体',
        default_borderless_mode: '开盖模式预设',
        default_enable_autofocus_module: '自动对焦预设',
        default_enable_diode_module: '混合雷射预设',
        diode_offset: '混合雷射偏移值',
        none: '无',
        close: '关闭',
        enabled: '启用',
        disabled: '不启用',
        groups: {
            general: '一般',
            update: '软体更新',
            connection: '连线',
            editor: '编辑器',
            path: '路径 (线段)',
            engraving: '雕刻 (扫描)',
            mask: '工作范围剪裁',
            text_to_path: '文本',
            modules: '扩充模组',
        },
        printer: {
            new_printer: '添加成型机',
            name: '成型机名称',
            current_password: '目前密码',
            set_password: '设置密码',
            security_notice: '你可以用密码保护你的成型机',
            connected_wi_fi: 'Wi-Fi 连接',
            advanced: '进阶',
            join_other_network: '加入其它网络',
            your_password: '新密码',
            confirm_password: '确认密码',
            save_password: '存储变更'
        },
        cancel: '取消',
        done: '套用',
        connect_printer: {
            title: '选择连接成型机'
        },
        notification_on: '开启',
        notification_off: '关闭',
        update_latest: '稳定版',
        update_beta: 'Beta',
        engine_change_fail: {
            'caption': '无法变更切片引擎',
            '1': '检查时发生错误',
            '2': 'cura 版本错误',
            '3': '路径不是 Cura',
            '4': 'path is not a exist file, please check engine path in setting section'
        },
        allow_tracking: '您是否愿意自动发送匿名用量数据，协助 FLUX 改进产品和服务？',
        flux_cloud: {
            processing: '处理中...',
            flux_cloud: 'Mozu CLOUD',
            back: '返回',
            next: '下一步',
            done: '结束',
            sign_in: '登录',
            sign_up: '注册',
            success: '成功',
            fail: '失败',
            cancel: '取消',
            try_again: '再试一次',
            bind: '绑定',
            bind_another: '绑定另一部机器',
            username: '用户名',
            nickname: '用户别名',
            email: '电子信箱',
            password: '密码',
            re_enter_password: '重新输入密码',
            forgot_password: '忘记密码?',
            sign_up_statement: '第一次使用？ <a href="%s">按此注册</a>',
            try_sign_up_again: '请重新<a href="%s">注册</a>',
            agreement: '同意 FLUX-Cloud <a href="#/studio/cloud/privacy">隐私权政策</a>, <a href="#/studio/cloud/terms">使用条款</a>',
            pleaseSignIn: '请使用 FLUX ID 登录',
            enter_email: '请输入您的电子信箱',
            check_inbox: '请至您的电子信箱确认!',
            error_blank_username: '请输入用户别名',
            error_blank_email: '请输入电子信箱',
            error_email_format: '请输入正确的电子信箱',
            error_email_used: '此电子信箱已被使用',
            error_password_not_match: '确认密码与密码不相同',
            select_to_bind: '请选择欲绑定的机器',
            binding_success: '绑定成功!',
            binding_success_description: '您可以开始使用 FLUX App 来监控机器',
            binding_fail: '绑定失败',
            binding_fail_description: '网络可能有问题，请再试一次',
            binding_error_description: '无法开启云端功能，请与客服人员联系，并附上机器错误记录',
            retrieve_error_log: '下载错误记录',
            binding: '绑定中...',
            check_email: '相关信进已寄出到您的电子信箱，请确认',
            email_exists: '电子信箱已被使用',
            not_verified: '请于您的电子信箱开启确认信件',
            user_not_found: '用户帐号密码错误',
            resend_verification: '重新寄送确认信件',
            contact_us: '请与 FLUX 客服联系',
            confirm_reset_password: '需要重新设置密码吗？',
            format_error: '登录失败，请重新登录',
            agree_to_terms: '请同意用户条款',
            back_to_list: '回机器列表',
            change_password: '密码变更',
            current_password: '目前登录密码',
            new_password: '新密码',
            confirm_password: '确认新密码',
            empty_password_warning: '密码不可为空白',
            WRONG_OLD_PASSWORD: '旧密码错误',
            FORMAT_ERROR: '密码格式错误',
            submit: '存储',
            sign_out: '注销',
            not_supported_firmware: '支持 FLUX cloud 需要机器固件 v1.5＋',
            unbind_device: '确认要不再绑定此机器?',
            CLOUD_UNKNOWN_ERROR: '机器无法连接到云端服务器. 请重新启动机器. (General)',
            CLOUD_SESSION_CONNECTION_ERROR: '机器无法连接到云端服务器. 请重新启动机器. (Session)',
            SERVER_INTERNAL_ERROR: '服务器发生错误，请稍后再试.',
        }
    },
    print: {
        import: '导入',
        save: '存储…',
        gram: '克',
        support_view: '支持预览',
        start_print: '打印',
        advanced: {
            general: '一般',
            layers: '切层',
            infill: '填充',
            support: '支撑',
            speed: '速度',
            custom: '文本',
            slicingEngine: '切片引擎',
            slic3r: 'Slic3r',
            cura: 'Cura',
            cura2: 'Cura2',
            filament: '线料',
            temperature: '温度与材料',
            detect_filament_runout: '侦测线料',
            flux_calibration: '自动校正',
            detect_head_tilt: '侦测工具头倾斜',
            layer_height_title: '层高',
            layer_height: '一般层高',
            firstLayerHeight: '底层层高',
            shell: '对象外壳',
            shellSurface: '对象外壳圈数',
            solidLayerTop: '顶部实心层数',
            solidLayerBottom: '底部实心层数',
            density: '填充密度',
            pattern: '填充图样',
            auto: 'auto',                       // do not change
            line: '线状',                       // do not change
            rectilinear: '直线',         // do not change
            rectilinearGrid: '直线格状',// do not change
            honeycomb: '蜂嵌套',             // do not change
            offset: '位移',
            xyOffset: '水平扩张',
            zOffset: 'Z 轴位移',
            cutBottom: '移除底部',

            curaInfill: {
                automatic: '自动',
                grid: '格状',
                lines: '线状',
                concentric: '同心',
                concentric_3d: '立体同心',
                cubic: '立方',
                cubicsubdiv: '立方细分',
                tetrahedral: '四面体',
                triangles: '三角形',
                zigzag: '锯齿'
            },
            curaSupport: {
                lines: '线状',
                grid: '格状',
                zigzag: '锯齿'
            },
            blackMagic: '黑魔法',
            spiral: '螺旋',
            generalSupport: '支撑',
            spacing: '线段间隔',
            overhang: '悬空角度',
            zDistance: 'Z轴间隔',
            raft: '底座',
            raftLayers: '底座层数',
            brim: '底部延伸圈数 (Brim)',
            skirts: '边界预览 (Skirt)',
            movement: '移动速度',
            structure: '结构速度',
            traveling: '移动',
            surface: '表面速度',
            firstLayer: '底层',
            solidLayers: '实心层',
            innerShell: '外壳内圈',
            outerShell: '外壳外圈',
            bridge: '架桥',
            config: '设置',
            presets: '默认',
            name: '名称',
            apply: '套用',
            save: '存储',
            saveAsPreset: '存储参数',
            cancel: '取消',
            delete: '删除',
            loadPreset: '加载参数',
            savePreset: '存储参数',
            reloadPreset: '重置参数',
            printing: '打印温度',
            firstLayerTemperature: '首层温度',
            flexibleMaterial: '软性材料'
        },
        mode: [
            {
                value: 'beginner',
                label: '入门',
                checked: true
            },
            {
                value: 'expert',
                label: '专家'
            }
        ],
        params: {
            beginner: {
                print_speed: {
                    text: '打印速度',
                    options: [
                        {
                            value: 'slow',
                            label: '中'
                        },
                        {
                            value: 'fast',
                            label: '快',
                            selected: true
                        }
                    ]
                },
                material: {
                    text: '材质',
                    options: [
                        {
                            value: 'pla',
                            label: 'PLA',
                            selected: true
                        }
                    ]
                },
                support: {
                    text: '支撑',
                    on: '支撑',
                    off: '关闭',
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
                    text: '平台',
                    options: [
                        {
                            value: 'raft',
                            label: '垫片',
                            selected: true
                        }
                    ]
                }
            },
            expert: {
                layer_height: {
                    text: '每层高度',
                    value: 0.3,
                    unit: 'mm'
                },
                print_speed: {
                    text: '打印速度',
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
            raft_on: '底座 ON',
            raft_off: '底座 OFF',
            support_on: '支撑 ON',
            support_off: '支撑 OFF',
            advanced: '更多选项',
            preview: '预览路径',
            plaTitle: 'PICK THE COLOR OF THE FILAMENT',
            transparent: 'TRANSPARENT',
            raftTitle: 'A Raft are layers built under your part and help it stick to the base plate',
            supportTitle: 'A Support is a generated structure to support overhanging part of your object, to prevent filament dropping',
            advancedTitle: 'Detail 3d printing parameters, you may acheive better result than default by adjusting them',
            confirmExitFcodeMode: '离开预览模式将会移除Fcode，是否继续？'
        },
        right_panel: {
            get: 'Get',
            go: 'Go',
            preview: '预览'
        },
        quality: {
            high: '品质 精细',
            med: '品质 中等',
            low: '品质 快速',
            custom: '品质 自订'
        },
        model: {
            fd1: 'Delta',
            fd1p: 'Delta+'
        },
        scale: '尺寸',
        rotate: '旋转',
        delete: '删除',
        reset: '重设',
        cancel: '取消',
        done: '确认',
        pause: '暂停',
        restart: '重新开始',
        download_prompt: '请输入文件名称',
        importTitle: '导入 3D 模型 ( .stl )',
        getFcodeTitle: '存储FLUX打印工作',
        goTitle: '准备打印',
        deviceTitle: '显示监控界面',
        rendering: '切片中',
        reRendering: '重新切片中',
        finishingUp: '完成中',
        savingFilePreview: '产生预览图',
        uploading: '读取中',
        uploaded: '已上传，分析模型中',
        importingModel: '导入模型',
        wait: '请稍候',
        out_of_range: '超过打印范围',
        out_of_range_message: '请缩小对象尺寸',
        drawingPreview: '绘制预览路径，请稍候',
        gettingSlicingReport: '正在取得最新切片状态'
    },
    draw: {
        pen_up: '移动高度',
        pen_down: '绘制高度',
        speed: '速度',
        pen_up_title: '笔不会碰到绘制表面的 Z 轴距离',
        pen_down_title: '笔会碰到绘制表面的 Z 轴距离, 必须比移动高度低',
        speed_title: '握架工具头移动的速度',
        units: {
            mms: 'mm/s',
            mm: 'mm'
        }
    },
    cut: {
        horizontal_calibrate: '水平\n校正',
        height_calibrate: '高度\n校正',
        running_horizontal_adjustment: '水平校正中',
        running_height_adjustment: '高度校正中',
        run_height_adjustment: '请调整刀具，并运行高度校正。',
        horizontal_adjustment_completed: '水平校正完成',
        height_adjustment_completed: '高度校正完成',
        you_can_now_cut: '恭喜您！您可以开始进行切割工作',
        zOffset: '高度调整',
        overcut: '闭环过切',
        speed: '速度',
        bladeRadius: '刀尖半径',
        backlash: 'Backlash 补偿',
        zOffsetTip: '刀头模块底部距离切割平面的高度调整',
        overcutTip: '当切割路径起始点与结束点座标相同时，切到结束点后再走一些从起始点开始的路径',
        speedTip: '切割速度',
        backlashTip: '如果使用第三方刀具直线不够直，则调整此参数',
        units: {
            mms: 'mm/s',
            mm: 'mm'
        }
    },
    laser: {
        import: '导入',
        save: '存储…',
        custom: '自订',
        presets: '默认',
        button_advanced: '进阶',
        confirm: '确认',
        get_fcode: '存储<br/>工作',
        export_fcode: '存储成工作文件 ...',
        name: '名称',
        go: 'GO',
        showOutline: '显示<br/>轮廓',
        do_calibrate: '看起来您似乎第一次使用激光雕刻功能，可以透过包装里附的牛皮卡找到最佳的焦距，是否要加载焦距校正图片？（稍后亦可以于进阶屏幕中加载）',
        process_caption: '输出中',
        laser_accepted_images: '雕刻支持格式：BMP/GIF/JPG/PNG/SVG',
        draw_accepted_images: '绘制支持格式：SVG',
        svg_fail_messages: {
            'TEXT_TAG': '不支持标签 &lt;text&gt;',
            'DEFS_TAG': '不支持标签 &lt;defs&gt;',
            'CLIP_TAG': '不支持标签 &lt;clip&gt;',
            'FILTER_TAG': '不支持标签 &lt;filter&gt;',
            'EMPTY': '内容为空',
            'FAIL_PARSING': '解析错误',
            'SVG_BROKEN': '文件损坏',
            'NOT_SUPPORT': '非 SVG 格式'
        },
        title: {
            material: '选择正确的材质来雕刻出最好的结果',
            object_height: '物体高度，从底盘到对象最高点之距离',
            height_offset: '激光高度调整，包含磁吸底版跟焦距误差，可根据焦距校正图片调整数字',
            shading: '使用激光渐层效果，会增加雕刻时间',
            advanced: '自行调整功率大小以及速度'
        },
        print_params: {
            object_height: {
                text: '物体高度',
                unit: 'mm'
            },
            height_offset: {
                text: '焦距调整',
                unit: 'mm'
            },
            shading: {
                text: '渐层',
                textOn: 'ON',
                textOff: 'OFF',
                checked: true
            }
        },
        object_params: {
            position: {
                text: '位置'
            },
            size: {
                text: '尺寸',
                unit: {
                    width: '宽',
                    height: '高'
                }
            },
            rotate: {
                text: '旋转'
            },
            threshold: {
                text: '图片曝光',
                default: 128
            }
        },
        advanced: {
            label: '进阶选项',
            form: {
                object_options: {
                    text: '材质',
                    label: '材质选项',
                    options: [
                        {
                            value: 'cardboard',
                            label: '牛皮纸',
                            data: {
                                laser_speed: 10,
                                power: 255
                            }
                        },
                        {
                            value: 'wood',
                            label: '木板',
                            data: {
                                laser_speed: 3,
                                power: 255
                            }
                        },
                        {
                            value: 'steel',
                            label: '皮革',
                            data: {
                                laser_speed: 5,
                                power: 255
                            }
                        },
                        {
                            value: 'paper',
                            label: '纸',
                            data: {
                                laser_speed: 2,
                                power: 255
                            }
                        },
                        {
                            value: 'cork',
                            label: '软木',
                            data: {
                                laser_speed: 5,
                                power: 255
                            }
                        },
                        {
                            value: 'other',
                            label: '其它',
                            data: {}
                        }
                    ]
                },
                laser_speed: {
                    text: '激光速度',
                    unit: 'mm/s',
                    fast: '快',
                    slow: '慢',
                    min: 0.8,
                    max: 20,
                    step: 0.1
                },
                power: {
                    text: '激光强度',
                    high: '强',
                    low: '弱',
                    min: 0,
                    max: 255,
                    step: 1
                }
            },
            save_and_apply: '存储并套用',
            save_as_preset: '存储',
            save_as_preset_title: '存储默认',
            load_preset_title: '加载',
            background: '自订背景',
            removeBackground: '移除背景',
            removePreset: '设置值将会移除',
            load_calibrate_image: '加载校正图片',
            apply: '套用',
            cancel: '取消',
            save: '存储'
        }
    },
    scan: {
        stop_scan: '取消',
        over_quota: '超过可容纳点云',
        convert_to_stl: '转换成 STL',
        scan_again: '再次扫描',
        start_multiscan: '多次扫描',
        processing: '处理中...',
        remaining_time: '剩余时间',
        do_save: '存储 STL',
        go: '开始',
        rollback: '返回',
        error: '错误',
        confirm: '确认',
        caution: '警告',
        cancel: '取消',
        delete_mesh: '真的要删除吗?',
        quality: '品质',
        scan_again_confirm: '是否确定要放弃目前的扫瞄结果？',
        calibrate: '校正',
        calibration_done: {
            caption: '校正完成',
            message: '你可以开始扫描了'
        },
        cant_undo: '无法复原',
        estimating: '估计中...',
        calibrate_fail: '校正失败',
        calibration_is_running: '扫描校正中',
        calibration_firmware_requirement: '请更新至固件以使用此功能 (1.6.9+)',
        resolution: [{
            id: 'best',
            text: '最佳',
            time: '~30分钟',
            value: 1200
        },
        {
            id: 'high',
            text: '精细',
            time: '~20分钟',
            value: 800
        },
        {
            id: 'normal',
            text: '中等',
            time: '~10分钟',
            value: 400
        },
        {
            id: 'low',
            text: '快速',
            time: '~5分钟',
            value: 200
        },
        {
            id: 'draft',
            text: '草稿',
            time: '~2分钟',
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
            filter: '操作',
            position: '位置',
            size: '尺寸',
            rotate: '旋转',
            crop: '剪裁',
            manual_merge: '手动合并',
            clear_noise: '去除噪点',
            save_pointcloud: '输出点云'
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
                caption: '未侦测到镜头画面 / 画面太暗',
                message: '压下，然后拉出扫描镜头，直至最底端发出固定声为止。'
            },
            'no object': {
                caption: '未侦测到校正工具',
                message: '请将扫描校正工具插在中心沟槽处，确保光源充足。'
            },
            'no laser': {
                caption: '未侦测到扫描激光',
                message: '请压下，并弹出扫描激光头，确保光源不要过亮。'
            }
        }
    },
    beambox: {
        tag:{
            g: '群组',
            use: '汇入图档',
            image: '图片',
            text: '文字'
        },
        toolbox: {
            ALIGN_LEFT: '向左靠齐',
            ALIGN_RIGHT: '向右靠齐',
            ALIGN_CENTER : '水平置中',
            ALIGN_TOP : '向上靠齐',
            ALIGN_MIDDLE : '垂直置中',
            ALIGN_BOTTOM : '向下靠齐',
            ARRANGE_HORIZON: '水平平均分配',
            ARRANGE_VERTICAL: '垂直平均分配',
            ARRANGE_DIAGONAL: '对角平均分配'
        },
        popup: {
            select_favor_input_device: '为了提供更好的用户体验<br/>请选择你喜爱的输入设备',
            select_import_method: '选择分层方式:',
            touchpad: '触摸板',
            mouse: '鼠标',
            layer_by_layer: '依图层分层',
            layer_by_color: '依颜色分层',
            nolayer: '不分层',
            loading_image: '载入图片中，请稍候...',
            no_support_text: 'Beam Studio 目前不支持由外部导入文本标签，请由矢量绘图软件将文本转成路径后再导入。',
            speed_too_high_lower_the_quality: '在此雕刻分辨率使用过高速度，可能导致渐层雕刻較差品质。',
            too_fast_for_path: '含有路径物件的图层速度过快，可能导致切割时位置误差。\n不建议超过在切割路径时超过 20mm/s。',
            too_fast_for_path_and_constrain: '以下图层： %s\n含有向量路径物件且速度超过 20mm/s，为维持雕刻的精度，向量路径速度将被限制在 20mm/s，您可以在偏好设定解除此限制。',
            both_power_and_speed_too_high: '激光管在高功率下耗损较快，使用低功率可以延长雷试管使用寿命。\n同时在此雕刻分辨率使用过高速度，可能导致渐层雕刻較差品质。',
            should_update_firmware_to_continue: '#814 您的固件版本不支持最新的软件改善。为了更良好的使用经验与雕刻品质，请先更新手机切膜机的固件以继续。 (主菜单 > 机器 > [ Your手机切膜机] > 固件更新)',
            more_than_two_object: '太多物件，只支援两物件操作',
            not_support_object_type: '不支援的物件类型',
            select_first: '请先选取物件以继续',
            select_at_least_two: '请选取两个物件以继续',
            import_file_contain_invalid_path: '#808 汇入的SVG档案中含有不存在的图片路径，请确认档案中所有连结之图片皆存在，或改将图片嵌入档案中。',
            import_file_error_ask_for_upload: '读取 SVG 档时发生错误，是否愿意上传档案回报错误给开发团队？',
            upload_file_too_large: '#819 档案大小过大，请联络客服。',
            successfully_uploaded: '档案已成功上传。',
            upload_failed: '#819 档案上传失败。',
            or_turn_off_borderless_mode: '或是关闭开盖模式',
            svg_1_1_waring: '此档案标示之 SVG 版本为 1.1 版，可能有潜在的不相容风险。',
            svg_image_path_waring: '此档案内含有以路径读取的图片，可能会有读取失败的风险。请在做图汇出 SVG 时，当点阵图相关选项改成嵌入。',
            dxf_version_waring: '此 DXF 档版本非 2013 版，可能有潜在的不相容风险。',
            dont_show_again: '别再显示此提醒',
            convert_to_path_fail: '转换成路径失败。',
            save_unsave_changed: '请问是否要储存未储存的变更，否则变更将会遗失？',
            dxf_bounding_box_size_over: '图像超出工作范围，请在 CAD 软体中将图像放置于原点附近，或确定图档单位是否正确设定。',
            progress: {
                uploading: '上传中'
            },
            backend_connect_failed_ask_to_upload: '#802 连接后端程式时持续发生错误，请问您是否要将错误报告上传到云端?',
            pdf2svg: {
                error_when_converting_pdf: '#824 将 PDF 转换成 SVG 时发生错误：',
                error_pdf2svg_not_found: '#825 无法找到 pdf2svg 指令，请使用您的套件管理装置安装 pdf2svg（e.g., "yum install pdf2svg" or "apt-get install pdf2svg"）。',
            },
            ungroup_use: '正要解散外部汇入的 DXF 或是 SVG ，在含有物件较多的情况，可能会需要等一阵子，是否确定解散？',
            vectorize_shading_image: '渐层影像在向量化时将花费较多时间，且容易有杂点，请将影像渐层关闭后再执行。',
        },
        zoom_block: {
            fit_to_window: '配合视窗尺寸'
        },
        left_panel: {
            insert_object: '插入对象',
            preview: '相机预览',
            borderless: '(开盖模式)',
            image_trace:'影像描图' ,
            advanced: '进阶选项',
            suggest_calibrate_camera_first: '提醒您：\n第一次使用相机，请先进行相机校正。并在每次使用时将平台对焦，以取得最好的效果。',
            end_preview: '结束预览模式',
            unpreviewable_area: '非相机预览范围',
            diode_blind_area: '非雕刻范围',
            borderless_blind_area: '非雕刻范围',
            borderless_preview: '开盖模式相机预览',
            rectangle: '长方形',
            ellipse: '椭圆形',
            line: '线段',
            image: '图片',
            text: '文本',
            label: {
                cursor: '选取',
                photo: '图片',
                text: '文字',
                line: '线段',
                rect: '方块',
                oval: '椭圆',
                polygon: '多边形',
                pen: '钢笔',
                array: '阵列',
                offset: '偏移',
                preview: '相机预览',
                trace: '影像描图',
                clear_preview: '清除预览'
            },
            insert_object_submenu: {
                rectangle: '矩形',
                ellipse: '椭圆形',
                line: '线段',
                image: '图片',
                text: '文字',
                path: '路径',
                polygon: '多边形'
            },
        },
        right_panel: {
            tabs: {
                layers: '图层',
                objects: '物件',
                path_edit: '路径编辑',
            },
            layer_panel: {
                layer1: '默认图层',
                layer_bitmap: '位图层',
                layer_engraving: '雕刻图层',
                layer_cutting: '切割图层',
                move_elems_to: '移动到：',
                notification: {
                    dupeLayerName: '已存在同名的图层!',
                    newName: '新图层名称',
                    enterUniqueLayerName: '请输入一个唯一的图层名称',
                    enterNewLayerName: '请输入新的图层名称',
                    layerHasThatName: '图层已经采用了该名称',
                    QmoveElemsToLayer: '您确定移动所选元素到图层\'%s\'吗?',
                },
                layers: {
                    layer: '图层',
                    layers: '图层',
                    del: '删除图层',
                    move_down: '向下移动图层',
                    new: '新建图层',
                    rename: '重命名图层',
                    move_up: '向上移动图层',
                    dupe: '复制图层',
                    lock: '锁定图层',
                    merge_down: '向下合并',
                    merge_all: '全部合并',
                    move_elems_to: '移动元素至:',
                    move_selected: '移动元素至另一个图层'
                },
            },
            laser_panel: {
                parameters: '選擇參數',
                strength: '功率',
                speed: '速度',
                repeat: '运行次数',
                focus_adjustment: '对焦调整',
                height: '物件高度',
                z_step: '每次递降',
                diode: '二极体雷射',
                times: '次',
                cut: '切割',
                engrave: '雕刻',
                more: '管理',
                delete: '删除',
                reset: '恢复预设',
                sure_to_reset: '这将会重置所有的预设参数，并保留您的自订参数，确定要继续进行吗？',
                apply: '套用',
                cancel: '取消',
                save: '储存参数',
                save_and_exit: '保存并退出',
                name: '名称',
                default: '预设',
                customized: '自订参数清单',
                inuse: '使用中',
                export_config: '汇出参数',
                new_config_name: '新参数名称',
                sure_to_load_config: '将要读取预设参数的排序与使用状况，并覆盖所有同名的自订参数，确定要继续进行吗？',
                dropdown: {
                    mm: {
                        wood_3mm_cutting: '木板 - 3mm 切割',
                        wood_5mm_cutting: '木板 - 5mm 切割',
                        wood_engraving: '木板 - 刻印',
                        acrylic_3mm_cutting: '压克力 - 3mm 切割',
                        acrylic_5mm_cutting: '压克力 - 5mm 切割',
                        acrylic_engraving: '压克力 - 刻印',
                        leather_3mm_cutting: '皮革 - 3mm 切割',
                        leather_5mm_cutting: '皮革 - 5mm 切割',
                        leather_engraving: '皮革 - 刻印',
                        fabric_3mm_cutting: '布料 - 3mm 切割',
                        fabric_5mm_cutting: '布料 - 5mm 切割',
                        fabric_engraving: '布料 - 刻印',
                        rubber_bw_engraving: '印章垫 - 刻印',
                        glass_bw_engraving:  '玻璃 - 刻印',
                        metal_bw_engraving: '不锈钢喷剂 - 刻印',
                        stainless_steel_bw_engraving_diode: '不锈钢 - 刻印（二极体雷射）',
                        save: '新增目前参数',
                        export: '汇出参数',
                        more: '管理',
                        parameters: '选择参数'
                    },
                    inches: {
                        wood_3mm_cutting: '木板 - 0.1\'\' 切割',
                        wood_5mm_cutting: '木板 - 0.2\'\' 切割',
                        wood_engraving: '木板 - 刻印',
                        acrylic_3mm_cutting: '压克力 - 0.1\'\' 切割',
                        acrylic_5mm_cutting: '压克力 - 0.2\'\' 切割',
                        acrylic_engraving: '压克力 - 刻印',
                        leather_3mm_cutting: '皮革 - 0.1\'\' 切割',
                        leather_5mm_cutting: '皮革 - 0.2\'\' 切割',
                        leather_engraving: '皮革 - 刻印',
                        fabric_3mm_cutting: '布料 - 0.1\'\' 切割',
                        fabric_5mm_cutting: '布料 - 0.2\'\' 切割',
                        fabric_engraving: '布料 - 刻印',
                        rubber_bw_engraving: '印章垫 - 刻印',
                        glass_bw_engraving:  '玻璃 - 刻印',
                        metal_bw_engraving: '不锈钢喷剂 - 刻印',
                        stainless_steel_bw_engraving_diode: '不锈钢 - 刻印（二极体雷射）',
                        save: '新增目前参数',
                        export: '汇出参数',
                        more: '管理',
                        parameters: '选择参数'
                    },
                    alerts: {
                        start_preview_timeout: '#803 启动相机预览时超时，请重新启動您的机器或是 Beam Studio ，如果此错误持续发生，请参考<a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/articles/360001111355">此则引导</a>。',
                        fail_to_start_preview: '#803 启动相机预览失败，请重新启動您的机器或是 Beam Studio ，如果此错误持续发生，请参考<a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/articles/360001111355">此则引导</a>。',

                    }
                },
                laser_speed: {
                    text: '激光速度',
                    unit: 'mm/s',
                    fast: '快',
                    slow: '慢',
                    min: 1,
                    max: 300,
                    step: 0.1
                },
                power: {
                    text: '激光強度',
                    high: '强',
                    low: '弱',
                    min: 1,
                    max: 100,
                    step: 0.1
                },
                para_in_use: '此参数已在使用中。',
                do_not_adjust_default_para: '无法调整预设参数。',
                existing_name: '已存在此名称的自订参数。'
            },
            object_panel: {
                zoom: '缩放',
                group: '群组',
                ungroup: '解散群组',
                halign: '水平对齐',
                valign: '垂直对齐',
                left_align: '靠左对齐',
                center_align: '置中对齐',
                right_align: '靠右对齐',
                top_align: '顶端对齐',
                middle_align: '中线对齐',
                bottom_align: '底部对齐',
                hdist: '水平均分',
                vdist: '垂直均分',
                union: '相加',
                subtract: '相减',
                intersect: '相交',
                difference: '相异',
                hflip: '水平翻转',
                vflip: '垂直翻转',
                option_panel: {
                    fill: '填充',
                    rounded_corner: '圆角',
                    font_family: '字体',
                    font_style: '字型',
                    font_size: '字级',
                    letter_spacing: '字距',
                    line_spacing: '行距',
                    vertical_text: '直书',
                    shading: '渐层',
                    threshold: '曝光阈值',
                },
                actions_panel: {
                    replace_with: '替换影像',
                    trace: '向量化',
                    grading: '曲线',
                    sharpen: '鋭化',
                    crop: '裁剪',
                    bevel: '生成斜角',
                    invert: '色彩反转',
                    convert_to_path: '转换为路径',
                    wait_for_parsing_font: '解析字体中... 请稍待 10 秒',
                    offset: '位移複製',
                    array: '阵列',
                    decompose_path: '解散非连续路径',
                    disassemble_use: '解散图档',
                    disassembling: '解散中...',
                    ungrouping: '解散群组中...',
                },
                path_edit_panel: {
                    node_type: '节点类型',
                },
            },
        },
        bottom_right_panel: {
            convert_text_to_path_before_export: '部分字体在不同系统间有差异，输出前请将字体转换成路径，以确保文本正确显示。转换文本至路径中...',
            retreive_image_data: '撷取影像资料中...',
            export_file_error_ask_for_upload: '汇出工作时发生错误，是否愿意上传工作场景回报错误给开发团队？',
        },
        image_trace_panel: {
            apply: '套用',
            back: '上一步',
            cancel: '取消',
            next: '下一步',
            brightness: '曝光',
            contrast: '对比',
            threshold: '临界值',
            okay: '完成',
            tuning: '描图参数'
        },
        photo_edit_panel: {
            apply: '套用',
            back: '上一步',
            cancel: '取消',
            next: '下一步',
            sharpen: '锐化',
            sharpness: '鋭化强度',
            crop: '裁剪',
            curve: '曲线',
            start: '开始',
            processing: '处理中',
            invert: '色彩反转',
            okay: '完成',
            phote_edit: '影像编辑'
        },
        document_panel: {
            document_settings: '文件设定',
            engrave_parameters: '雕刻参数',
            workarea: '工作范围',
            rotary_mode: '旋转轴',
            borderless_mode: '开盖模式',
            engrave_dpi: '雕刻分辨率',
            enable_diode: '混合雷射',
            enable_autofocus: '自动对焦',
            add_on: '扩充模组',
            low: '低',
            medium: '中',
            high: '高',
            ultra: '极高',
            enable: '啟用',
            disable: '关闭',
            cancel: '取消',
            save: '储存'
        },
        object_panels: {
            position: '位置',
            rotation: '旋转',
            size: '大小',
            width: '宽',
            height: '长',
            center: '圆心',
            ellipse_radius: '大小',
            rounded_corner: '圆角',
            radius: '半径',
            points: '端点',
            length: '长度',
            text: '文本',
            font_size: '字级',
            fill: '填充',
            letter_spacing: '字距',
            line_spacing: '行距',
            vertical_text: '直书',
            convert_to_path: '转换为路径',
            convert_to_path_to_get_precise_result: '部分字体在不同系统间有差异，输出前请将字体转换成路径，以确保文本正确显示',
            wait_for_parsing_font: '解析字体中... 请稍待 10 秒',
            text_to_path: {
                font_substitute_pop: '文字:『%s』中含有当前字体:『%s』不支援的字元: %s，\n将替换成以下字体:『%s』。',
                check_thumbnail_warning: '转换文字时出现字体不支援的情形，请在送出工作前，再次检查预览图确认文字是否如预期转换。'
            },
            laser_config: '激光设置',
            shading: '渐层',
            threshold: '曝光阈值',
            lock_desc: '缩放时固定比例 (SHIFT)'
        },
        tool_panels:{
            cancel: '取消',
            confirm: '确认',
            grid_array: '生成阵列',
            array_dimension: '阵列维度',
            rows: '列',
            columns: '行',
            array_interval: '阵列间隔',
            dx: '宽',
            dy: '高',
            offset: '偏移物件',
            nest: '排列最佳化',
            _offset: {
                direction: '偏移物件',
                inward: '向內',
                outward: '向外',
                dist: '偏移距离',
                corner_type: '边角',
                sharp: '尖角',
                round: '圆角',
                fail_message: '生成偏移物件失败',
                not_support_message: '选取物件中含有不支援的类型：\n图片、群组、文字、汇入图档\n这些类型的物件将被忽略。',
            },
            _nest: {
                start_nest: '开始排列',
                stop_nest: '停止排列',
                end: '结束',
                spacing: '间距',
                rotations: '旋转方向数距',
                end_when_working: '将会结束目前正在进行的排列工作。',
                no_element: '没有物件可以进行排列。',
            }
        },
        network_testing_panel: {
            network_testing: '网路检测',
            local_ip: '本机 IP 位置：',
            insert_ip: '目标 IP 位置：',
            empty_ip: '#818 请先输入目标 IP 位置',
            start: '检测',
            end: '結束',
            testing: '网路检测中...',
            invalid_ip: '#818 错误的 IP 位置',
            network_healthiness: '连线健康度',
            average_response: '平均回覆时间',
            test_completed: '检测完成',
            test_fail: '检测失敗',
            cannot_connect_1: '无法与目标 IP 建立连线',
            cannot_connect_2: '无法与目标 IP 建立连线，请确认是否与目标 IP 在同一网路',
            cannot_get_local: '无法取得本地 IP 位置',
            fail_to_start_network_test: '#817 無法開始网路检测。'
        },
        layer_color_config_panel: {
            layer_color_config: '图层颜色参数设定',
            color: '颜色',
            power: '功率',
            speed: '速度',
            repeat: '执行次数',
            add: '新增',
            save: '储存',
            cancel: '取消',
            default: '回复预设',
            add_config: '新增颜色',
            in_use: '此颜色已在使用中。',
            no_input: '请输入颜色色码。',
            sure_to_reset: '您将会失去所有自订颜色参数，确定要回复到预设值？',
            sure_to_delete: '确定要删除这项颜色参数。'
        },
        svg_editor: {
            unnsupported_file_type: 'Beam Studio 不直接支持此文件格式。请先输出成图片档或 SVG 格式',
            unnsupport_ai_file_directly: '请先将您的 AI 档输出成 SVG 或 图片档，再导入至 Beam Studio',
            unable_to_fetch_clipboard_img: '无法读取复制连结中的档案',
        },
        units: {
            walt: 'W',
            mm: 'mm'
        }
    },
    select_printer: {
        choose_printer: '请选择要设置的机器',
        notification: '"%s" 需要密码',
        submit: '送出',
        please_enter_password: '"密码',
        auth_failure: '#811 认证失败',
        retry: '重新选择',
        unable_to_connect: '#810 无法与机器创建稳定连接'
    },
    device: {
        pause: '暂停',
        paused: '已暂停',
        pausing: '正在暂停',
        selectPrinter: '选择成型机',
        retry: '重试',
        status: '状态',
        busy: '忙碌中',
        ready: '待命中',
        reset: '重设(kick)',
        abort: '取消工作',
        start: '开始',
        please_wait: '请稍待...',
        quit: '中断链接',
        heating: '加热中',
        completing: '完成中',
        aborted: '已终止',
        completed: '已完成',
        calibrating: '校正中',
        showOutline: '绘制轮廓中',
        aborting: '取消工作中',
        starting: '启动中',
        preparing: '准备中',
        resuming: '恢复中',
        scanning: '扫描',
        occupied: '机器被占用',
        running: '工作中',
        uploading: '上传中',
        processing: '处理中',
        disconnectedError: {
            caption: '机器连接中断',
            message: '请确认 %s 的网络连接是否正常'
        },
        noTask: '目前无任何工作',
        pleaseWait: '请稍待...',
        finishing: '完成中',
        initiating: '启动中',
        unknown: '未知状态',
        pausedFromError: '发生错误暂停',
        model_name: '型号',
        IP: 'IP',
        serial_number: '序号',
        firmware_version: '固件版本',
        UUID: 'UUID',
        select: '选择',
        deviceList: '机器列表',
        calibration: {
            title: '自动校正',
            A: '水平与高度',
            H: '高度',
            N: '关闭',
            byFile: '根据 FCODE 设置'
        },
        detectFilament: {
            title: '侦测线料',
            on: '开启',
            off: '关闭',
            byFile: '根据 FCODE 设置'
        },
        filterHeadError: {
            title: '工具头错误侦测',
            shake: '过度摇晃',
            tilt: '倾斜',
            fan_failure: '风扇故障',
            laser_down: '激光安全锁',
            byFile: '根据 FCODE 设置',
            no: '关闭'
        },
        autoresume: {
            title: '智能工作恢复',
            on: '开启',
            off: '关闭'
        },
        broadcast: {
            title: 'UPNP 广播',
            L: '默认',
            A: '密集',
            N: '关闭'
        },
        enableCloud: {
            title: '云端操作',
            A: '开启',
            N: '关闭'
        },
        backlash: '路径几何误差补正',
        turn_on_head_temperature: '开启喷头温度',
        plus_camera: '升级包镜头',
        plus_extrusion: '升级包挤出马达',
        movement_test: '打印前运动测试',
        machine_radius: 'Delta机构半径',
        postback_url: '状态回传URL',
        disable: '关闭',
        enable: '开启',
        beambox_should_use_touch_panel_to_adjust: '请至Beambox 触控面板调整设置。'
    },
    monitor: {
        change_filament                     : 'CHANGE FILLAMENT',
        browse_file                         : 'BROWSE FILE',
        monitor                             : 'MONITOR',
        currentTemperature                  : 'Current Temp',
        nothingToPrint                      : 'There is nothing to print',
        go                                  : '开始',
        start                               : '开始',
        pause                               : '暂停',
        stop                                : '停止',
        record                              : 'RECORD',
        camera                              : '相机',
        connecting                          : '连接中，请稍候',
        HEAD_OFFLINE                        : '#110 没有侦测到工具头\n请确认工具头传输线完整插入 <a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/articles/218183157">暸解更多</a>',
        HEAD_ERROR_CALIBRATING              : '#112 工具头校正失误\n请重新装载工具头，并确认磁铁关节的附着',
        HEAD_ERROR_FAN_FAILURE              : '#113 风扇无法转动\n请尝试用细针戳一下 <a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/articles/217732178">暸解更多</a>',
        HEAD_ERROR_HEAD_OFFLINE             : '#110 没有侦测到工具头\n请确认工具头传输线完整插入 <a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/articles/218183157">暸解更多</a>',
        HEAD_ERROR_TYPE_ERROR               : '#111 侦测到错误工具头\n请安装正确的对应工具头',
        HEAD_ERROR_INTLK_TRIG               : '#116 侦测到雕刻工具头倾斜\n请确认金属棒正确链接，雕刻头与握架紧密结合以继续<a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/articles/217085937">了解更多</a>',
        HEAD_ERROR_RESET                    : '#114 工具头传输线接触不良\n请确认工具头传输线完整插入以继续，如持续发生此问题，请联系 FLUX 客服 <a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/articles/218183167">暸解更多</a>',
        HEAD_ERROR_TILT                     : '#162 侦测到工具头倾斜\n请确认球型关节正确附着以继续',
        HEAD_ERROR_SHAKE                    : '#162 侦测到工具头倾斜\n请确认球型关节正确附着以继续',
        HEAD_ERROR_HARDWARE_FAILURE         : '#164 工具头温度异常\n请联系 FLUX 客服<a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/articles/218415378">暸解更多</a>',
        'HEAD_ERROR_?'                      : '#199 Toolhead error\nCheck if the toolhead is abnormal',
        HARDWARE_ERROR_FILAMENT_RUNOUT      : '#121 没有侦测到线料\n请重新插入新的线料 <a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/articles/218931757">了解更多</a>',
        HARDWARE_ERROR_0                    : '#121 没有侦测到线料\n请重新插入新的线料 <a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/articles/218931757">了解更多</a>',
        HARDWARE_ERROR_PLATE_MISSING        : '#122 没有侦测到工作平台\n请放上工作平台金属板',
        HARDWARE_ERROR_ZPROBE_ERROR         : '#123 水平校正失败\n请移除可能影响校正的物体（喷嘴残料、工作平台上杂质）<a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/articles/218931767">暸解更多</a>',
        HARDWARE_ERROR_CONVERGENCE_FAILED   : '#123 水平校正失败\n请移除可能影响校正的物体（喷嘴残料、工作平台上杂质）<a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/articles/218931767">暸解更多</a>',
        HARDWARE_ERROR_HOME_FAILED          : '#124 原点校正失败\n请排除轨道上异物，确定传输线不会被夹到 <a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/articles/218931807">暸解更多</a>',
        HARDWARE_ERROR_MAINBOARD_ERROR      : '#401 主板没有回应。请联系 FLUX 客服。',
        HARDWARE_ERROR_SUBSYSTEM_ERROR      : '#402 子系统没有回应。请联系 FLUX 客服。',
        HARDWARE_ERROR_SENSOR_ERROR         : '温度侦测器发生问题。请联系 FLUX 客服。',
        HARDWARE_ERROR_SENSOR_ERROR_FSR     : '压力传感芯片读数错误',
        HARDWARE_ERROR_PUMP_ERROR           : '#900 水冷未开，请联系客服 (02) 2651-3171',
        HARDWARE_ERROR_DOOR_OPENED          : '#901 门盖开启，将门盖关上以继续',
        HARDWARE_ERROR_OVER_TEMPERATURE     : '#902 水温过高，请稍后再继续',
        USER_OPERATION_ROTARY_PAUSE         : '请切换旋转轴马达开关',
        WRONG_HEAD                          : '请更换成打印工具头',
        USER_OPERATION                      : '别的用户正在占用机器',
        RESOURCE_BUSY                       : '机器忙碌中\n如果机器没有在进行动作， 请重新启动机器',
        DEVICE_ERROR                        : '机器错误\n请重新启动机器',
        NO_RESPONSE                         : '机器错误\n请重新启动机器',
        SUBSYSTEM_ERROR                     : '#402 子系统没有回应。请联系 FLUX 客服。',
        HARDWARE_FAILURE                    : '机器错误\n请重新启动机器',
        MAINBOARD_OFFLINE                   : '机器错误\n请重新启动机器',
        G28_FAILED                          : '#124 原点校正失败\n请排除轨道上异物，并重新插拔工具头连接线 <a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/articles/218931807">暸解更多</a>',
        FILAMENT_RUNOUT_0                   : '#121 没有侦测到线料\n请重新插入新的线料 <a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/articles/218931757">了解更多</a>',
        USER_OPERATION_FROM_CODE            : '使用操作暂停（更换线料）',
        processing                          : '处理中',
        savingPreview                       : '正在产生预览图',
        hour                                : '小时',
        minute                              : '分',
        second                              : '秒',
        left                                : '完成',
        temperature                         : '温度',
        forceStop                           : '是否强制停止现在工作?',
        upload                              : '上传',
        download                            : '下载',
        relocate                            : '重新定位',
        cancel                              : '取消',
        prepareRelocate                     : '准备重新定位中',
        fileNotDownloadable                 : '下载不支持此文件格式',
        cannotPreview                       : '无法预览此文件',
        extensionNotSupported               : '上传文件不支持此文件格式',
        fileExistContinue                   : '文件已存在，是否要覆盖？',
        confirmGToF                         : 'GCode 上传后会自动转档成 FCode，是否继续？',
        updatePrintPresetSetting            : 'Mozu Studio 有新的默认打印参数。\n是否要更新？（会删除目前参数）',
        confirmFileDelete                   : '是否确定要删除这个文件？',
        task: {
            EXTRUDER                        : '打印',
            PRINT                           : '打印',
            LASER                           : '激光雕刻',
            DRAW                            : '数位绘图',
            CUT                             : '贴纸切割',
            VINYL                           : '贴纸切割',
            BEAMBOX                         : '激光雕刻',
            'N/A'                           : '自由模式'
        },
        device: {
            EXTRUDER                        : '打印工具头',
            LASER                           : '雕刻工具头',
            DRAW                            : '绘制工具头'
        },
        cant_get_toolhead_version           : '无法取得最新版本信息'
    },
    alert: {
        caption: '错误',
        duplicated_preset_name: '重复的默认名称',
        info: '消息',
        warning: '警告',
        error: '错误',
        oops: '哎呀',
        retry: '重试',
        abort: '放弃',
        confirm: '确认',
        cancel: '取消',
        close: '关闭',
        ok: '确定',
        ok2: '好',
        yes: ' 是',
        no: '否',
        stop: '停止',
        save: '储存',
        dont_save: '不要储存'
    },
    caption: {
        connectionTimeout: '连接逾时'
    },
    message: {
        connecting: '连接中...',
        connectingMachine: '连接 %s 中...',
        tryingToConenctMachine: '连接机器中...',
        connected: '已连接',
        authenticating: '密码验证中...',
        runningTests: '运动测试中...',
        machineNotConnected: 'Machine is not connected',
        notPrinting: 'Printing is not in progress',
        nothingToPrint: 'Nothing to print (source blob missing)',
        connectionTimeout: '#805 请确认你的网络状态和机器的 Wi-Fi 指示灯是否为恒亮',
        device_not_found: {
            caption: '找不到默认机器',
            message: '#812 请确认默认机器的 Wi-Fi 指示灯，或取消设置默认机器'
        },
        device_busy: {
            caption: '机器忙碌中',
            message: '机器正在进行另外一项工作，请稍候再试。如果机器持续没有回应，请将机器重新启动。'
        },
        device_is_used: '机器正被使用中，是否要终止现在任务？',
        device_in_use: '机器正被使用中，请停止或暂停目前的任务',
        invalidFile: '文件不是正确的 STL 格式',
        failGeneratingPreview: '无法存储预览图',
        slicingFailed: 'Slic3r 切片错误',
        no_password: {
            content: '请用 USB 设置机器密码，以提供此台电脑连接',
            caption: '未设置密码'
        },
        image_is_too_small: '图档内容有误',
        monitor_too_old: {
            caption: '固件需要更新',
            content: '#814 请按照<a target="_blank" href="http://helpcenter.flux3dp.com/hc/zh-tw/articles/216251077">此说明</a>安装最新固件版本'
        },
        cant_establish_connection: '无法正常启动 Mozu Studio API，建议手动安装 Visual C++ Redistributable 2015，如持续发生，请<a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/requests/new" target="_blank">联系 FLUX 客服</a>',
        application_occurs_error: '应用程序发生异常，请使用“功能表 > 说明 > 错误回报”',
        error_log: '错误消息',
        fcodeForLaser: '文件为雕刻工作',
        fcodeForPen: '文件为绘图工作',
        confirmFCodeImport: '加载.fc文件将清除目前所有场景，是否继续？',
        confirmSceneImport: '加载.fsc文件将清除目前所有场景，是否继续？',
        brokenFcode: '无法开启 %s',
        slicingFatalError: '切片时发生错误，请上传模型文件给 FLUX 客服',
        unknown_error: '#821 无法与机器创建连接，请使用“功能表 > 说明 > 错误回报”',
        unknown_device: '#826 无法与机器创建连接，请确认 USB 有连接于机器',
        important_update: {
            caption: '重要更新',
            message: 'Delta 有重要固件更新，是否要现在更新？',
        },
        unsupport_osx_version: '目前系统版本 MacOS X %s 较旧，部分功能可能无法使用，请更新到最新版。',
        unsupport_win_version: '目前系统版本 %s 较旧，部分功能可能无法使用，请更新到最新版。',
        need_password: '需要密码与机器创建连接',
        unavailableWorkarea: '#804 目前设定的工作范围超过目标机器的工作范围。请确认选择的机器型号，或从 编辑 > 文件设定 更改工作范围。',
        new_app_downloading: 'Mozu Studio 下载中',
        new_app_download_canceled: 'Mozu Studio 下载已被取消',
        new_app_downloaded: '新版Mozu Studio 下载完毕',
        ask_for_upgrade: '马上升级吗?',
        please_enter_dpi: '请输入该文件的 dpi',
        auth_error: '#820 认证失败：请将 Beam Studio 以及机器韧体更新至最新版。',
        gcode_area_too_big: '导入的 gcode 文件超过打印范围',
        empty_file: '文件内容不存在',
        usb_unplugged: 'USB 连接逾时，请确认与机器的连接',
        launghing_from_installer_warning: 'Mozu Studio 不是从应用程序文件夹开启，可能会产生问题。请将 Mozu Studio 移到应用程序文件夹再使用。',
        uploading_fcode: '正在上传 fcode',
        cant_connect_to_device: '#827 无法链接机器，请确认机器是否开启，以及与机器的链接方式',
        unable_to_find_machine: '无法连接到机器 ',
        unable_to_start: '#830 无法开始工作，如果持续发生，请附上错误回报，与我们联系:\n',
        camera_fail_to_transmit_image: '相机传输照片异常，请将 Beambox 重新开机。如果问题持续发生，请与我们联系。'
    },
    machine_status: {
        '-10': '動作模式',
        '-2': '扫描中',
        '-1': '维护中',
        0: '待命中',
        1: '初始化',
        2: 'ST_TRANSFORM',
        4: '启动中',
        6: '回复中',
        16: '工作中',
        18: '回复中',
        32: '已暂停',
        36: '已暂停',
        38: '暂停中',
        48: '已暂停',
        50: '暂停中',
        64: '已完成',
        66: '完成中',
        68: '准备中',
        128: '已中断',
        UNKNOWN: '-'
    },
    head_module: {
        EXTRUDER: '打印',
        LASER: '激光',
        UNKNOWN: '',
        error: {
            'missing': '错误消息不足',
            '0': '未知模块工具头',
            '1': '侦测感应器无法连接',
            '2': 'No hello', // pi will send head_error_reset before this is issued
            '3': '#112 工具头校正失误\n请重新装载工具头，并确认磁铁关节的附着',
            '4': '#162 侦测到工具头倾斜\n请确认球型关节正确附着以继续',
            '5': '#162 侦测到工具头倾斜\n请确认球型关节正确附着以继续',
            '6': '#119 打印工具头无法控制温度，请联系 FLUX 客服。',
            '7': '#113 风扇无法转动\n请尝试用细针戳一下 <a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/articles/217732178">暸解更多</a>',
            '8': '#116 侦测到雕刻工具头倾斜\n请确认金属棒正确链接，雕刻头与握架紧密结合以继续<a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/articles/217085937">了解更多</a>',
            '9': '#118 打印工具头无法加温，请联系 FLUX 客服。'
        }
    },
    change_filament: {
        home_caption: '更换线料',
        load_filament_caption: '进料',
        load_flexible_filament_caption: '进软料',
        unload_filament_caption: '退料',
        cancel: '取消',
        load_filament: '进料',
        load_flexible_filament: '进软料',
        unload_filament: '退料',
        next: '下一步',
        heating_nozzle: '打印工具头加热中',
        unloading: '自动退料中',
        loaded: '进料完成',
        unloaded: '退料完成',
        ok: '确定',
        kicked: '进料进程被中断',
        auto_emerging: '请插入线料',
        loading_filament: '进料中',
        maintain_head_type_error: '打印工具头未正确安装',
        disconnected: '连接不稳，请确认机器连接状况并稍后再试一次',
        maintain_zombie: '请重新启动机器',
        toolhead_no_response: '#117 打印工具头没有回应 <a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/articles/218347477">暸解更多</a>'
    },
    head_temperature: {
        title: '开启喷头温度',
        done: '结束',
        target_temperature: '目标温度',
        current_temperature: '目前温度',
        set: '设置',
        incorrect_toolhead: '错误工具头，请使用打印工具头',
        attach_toolhead: '请插上打印工具头'
    },
    camera_calibration: {
        update_firmware_msg1: '您的固件版本不支援此功能。请先更新 Beambox 的固件至 v',
        update_firmware_msg2: '以上以继续。 (主选单 > 机器 > [ Your Beambox ] > 固件更新',
        camera_calibration: '相机校正',
        next: '下一步',
        cancel: '取消',
        back: '上一步',
        finish: '完成',
        please_goto_beambox_first: '请先选择 Beambox 功能，再进行校正',
        please_place_paper: {
            beambox: '请将干净 A4 白纸放在工作区域的左上角',
            beamo: '请将干净 A4 白纸放在工作区域的左上角',
        },
        please_refocus: {
            beambox: '请旋转升降平台旋钮，直到轻触焦距螺丝，完成对焦',
            beamo: '请转开焦距固定环，调整雷射头至平台轻触焦距尺，完成对焦',
        },
        dx: '水平位移',
        dy: '垂直位移',
        rotation_angle: '旋转角度',
        x_ratio: '水平比例',
        y_ratio: '垂直比例',
        show_last_config: '显示前次校正结果',
        hide_last_config: '隐藏前次校正结果',
        taking_picture: '截取图片中...',
        start_engrave: '开始绘制校正图片',
        analyze_result_fail: '校正失败<br/>请确认:<br/>1. 校正图片完整画在 A4 纸上<br/>2. 已旋转升降平台旋钮，直到轻触焦距螺丝，完成对焦',
        no_lines_detected: '无法从校正图片上侦测到线段<br/>请确认:<br/>1. 校正图片完整画在 A4 纸上<br/>2. 已旋转升降平台旋钮，直到轻触焦距螺丝，完成对焦',
        drawing_calibration_image: '绘制校正图片中...',
        please_confirm_image: '<div><img class="img-center" src=%s /></div>请确认:<br/>1. 校正图片完整画在 A4 纸上<br/>2. 已旋转升降平台旋钮，直到轻触焦距螺丝，完成对焦<br/>3. 若激光没成功射出，请至 Beambox 机器屏幕上选择"动作"，并将"功率倍率"与"速度倍率"调回正常值，再重新校正一次。',
        calibrate_done: '校正相机完成<br/>使用时请正确对焦以取得良好的预览效果。',
        hint_red_square: '请将红框对齐切割出来的方块',
        hint_adjust_parameters: '由这些参数来调整红框的位置，旋转与大小'
    },
    diode_calibration: {
        update_firmware_msg1: '您的固件版本不支援此功能。请先更新 Beambox 的固件至 v',
        update_firmware_msg2: '以上以继续。 (主选单 > 机器 > [ Your Beambox ] > 固件更新',
        diode_calibration: '混合雷射模组校正',
        next: '下一步',
        cancel: '取消',
        back: '上一步',
        start_engrave: '开始绘制校正图片',
        finish: '完成',
        please_do_camera_calibration_and_focus: {
            beambox: '校正混合雷射需要使用相机校正参数，请确认您的机器已进行过相机校正。并请旋转升降平台旋钮，直到轻触焦距螺丝或焦距尺，完成对焦',
            beamo: '校正混合雷射需要使用相机校正参数，请确认您的机器已进行过相机校正。并请转开焦距固定环，调整雷射头至平台轻触焦距尺，完成对焦',
        },
        please_place_paper: {
            beambox: '请将干净 A4 白纸放在工作区域的左上角',
            beamo: '请将干净 A4 白纸放在工作区域的左上角',
        },
        dx: '水平位移',
        dy: '垂直位移',
        drawing_calibration_image: '绘制校正图片中...',
        taking_picture: '截取图片中...',
        calibrate_done: '校正完成<br/>混合雷射模组偏移值已自动储存。',
        hint_red_square: '请将红框对齐切割出来的方块',
        hint_adjust_parameters: '由这些参数来调整红框的位置',
    },
    input_machine_password: {
        require_password: '"%s" 需要密码',
        connect: '连接',
        password: '密码'
    },
    set_default: {
        success: '%s 已设为默认机器',
        error: '由于网络问题，无法将 %s 设为默认机器'
    },
    tutorial: {
        set_first_default_caption: '欢迎使用',
        set_first_default: '是否要将 %s 设为默认机器?',
        startWithFilament: '首先，让我们先填装线料',
        startWithModel: '接下来，让我们加载范例3Ｄ模型',
        startTour: '嗨，欢迎<br/>这是你第一次使用打印功能,<br/>你希望观看打印功能教学吗？',
        clickToImport: '点击导入以加载 3D 模型',
        selectQuality: '选择打印品质',
        clickGo: '按下开始以准备打印',
        startPrint: '确定平台上没有格线，并于平台上涂上足厚口红胶待其干燥，即可开始打印',
        skip: '跳过教学',
        startPrintDeltaPlus: '确认将磁铁打印版放上平台',
        runningMovementTests: '进行运动测试',
        connectingMachine: '连接机器中',
        movementTestFailed: { caption: '无法通过运动测试',  message: '1. 请确认工具头连接线不会造成过大阻力<br/>2. 上盖工具头连接线接头没入约一半<br/>3. 可尝试将工具头连接线顺时针或逆时针旋转 180 度再插入<br/>4. 参考 <a target="_blank" href="https://flux3dp.zendesk.com/hc/zh-tw/articles/115003674128">此篇文章</a><br/>再试一次？' },
        befaultTutorialWelcome: '非常感谢您购买 FLUX Delta+！<br/><br/>以下内容能帮助您快速了解并使用您的 FLUX Delta+<br/>期待 FLUX Delta+ 能陪伴您度过美好的时光<br/><br/>＊请务必先观看教学影片！请打开中文本幕',
        openBrowser: '开启网页',
        welcome: '欢迎使用',
        needNewUserTutorial: '请问您是否需要 Beam Studio 的教学？',
        needNewInterfaceTutorial: '请问是否需要为您介绍 Beam Studio 的新介面？',
        next: '下一步',
        look_for_machine: '寻找机器中',
        unable_to_find_machine: '无法找到可用于新手教学的机器，是否进行要进行连线设定、重试或是跳过教学？',
        skip_tutorial: '已跳过新手教学，您可以在「说明」>「显示新手教学」再次启动新手教学。',
        set_connection: '连线设定',
        retry: '重试',
        newUser: {
            draw_a_circle: '画一个圆',
            drag_to_draw: '拖曳以生成图形',
            infill: '设定填充',
            switch_to_layer_panel: '切换到图层面板',
            set_preset_wood_engraving: '設定參數：木板 - 刻印',
            set_preset_wood_cut: '設定參數：木板 - 切割',
            add_new_layer: '新增图层',
            draw_a_rect: '画一个方形',
            switch_to_preview_mode: '切换到相机预览模式',
            preview_the_platform: '预览工作平台',
            put_wood: '1. 放进木板',
            adjust_focus: '2. 调整焦距',
            close_cover: '3. 将门盖关上',
            send_the_file: '送出工作',
            end_alert: '请问您是否确定要结束教学？',
            please_select_wood_engraving: '请选择「木板 - 刻印」参数。',
            please_select_wood_cutting: '请选择「木板 - 切割」参数。',
        },
        newInterface: {
            camera_preview: '相机预览',
            select_image_text: '选取、图片、文字工具',
            basic_shapes: '基本几何形状',
            pen_tool: '钢笔工具',
            add_new_layer: '新增图层',
            rename_by_double_click: '双击以重新命名',
            drag_to_sort: '拖曳以排序',
            layer_controls: '右键点击以呼叫图层控制功能：\n复制、合并、锁定、删除图层',
            switch_between_layer_panel_and_object_panel: '在图层面板与物件面板间切换',
            align_controls: '排列控制项',
            group_controls: '群组、解散群组',
            shape_operation: '几何图形操作',
            flip: '翻转',
            object_actions: '物件操作',
            end_alert: '请问您是否确定要结束新介面介绍？',
        },
        links: {
            adjust_focus_bm: 'https://flux3dp.zendesk.com/hc/zh-tw/articles/360001684196',
            adjust_focus_bb: ' https://support.flux3dp.com/hc/zh-tw/articles/360001683675',
        },
        tutorial_complete: '介绍完毕，开始创作吧！',
    },
    slicer: {
        computing: '计算中',
        error: {
            '6': '工作路径超过打印范围, 请缩小物体尺寸、关闭底座、底部延伸圈数或是边界预览',
            '7': '进阶设置参数错误\n',
            '8': '切片:: 切片结果要求早于切片结束',
            '9': '切片:: 路径结果要求早于切片结束',
            '10': '切片:: 原始模型不存在于切片引擎，需重启 Mozu Studio',
            '13': '切片:: 重制错误，复制原始ID不存在，需重启 Mozu Studio',
            '14': '切片:: 无法设置对象位置及相关信息，需重启 Mozu Studio',
            '15': '切片:: 模型文件内容无法解析',
            '16': '切片:: 切片引擎异常结束，建议调整设置',
            '1006': 'WS 已被强制关闭, 请于menu上方取得错误回报，寄送回FLUX'
        },
        pattern_not_supported_at_100_percent_infill: 'Slic3r 的 rectilinear 填充图样只支持 100% 的填充密度'
    },
    calibration: {
        RESOURCE_BUSY: '请确认机器的状态是于待命中',
        headMissing: '无法取得工具头信息，请确认工具头是否连接于机器',
        calibrated: '平台校正完成',
        extruderOnly: '请使用打印工具头来做校正'
    },
    head_info: {
        ID                  : 'ID',
        VERSION             : '工具头固件版本',
        HEAD_MODULE         : '工具头种类',
        EXTRUDER            : '打印模块',
        LASER               : '雷刻模块',
        USED                : '使用时间',
        HARDWARE_VERSION    : '硬件版本',
        FOCAL_LENGTH        : '焦距调整',
        hours               : '小时',
        cannot_get_info     : '无法读取工具头信息'
    }
};
