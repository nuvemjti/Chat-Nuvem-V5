const messages = {
    zh: {
      translations: {
        signup: {
          title: "注册",
          toasts: {
            success: "用户创建成功！请登录！",
            fail: "创建用户时出错。请检查报告的数据。",
          },
          form: {
            name: "姓名",
            email: "电子邮件",
            password: "密码",
          },
          buttons: {
            submit: "注册",
            login: "已有账户？登录！",
          },
        },
        login: {
          title: "登录",
          form: {
            email: "电子邮件",
            password: "密码",
          },
          buttons: {
            submit: "进入",
            register: "没有账户？注册！",
          },
        },
        auth: {
          toasts: {
            success: "登录成功！",
          },
        },
        dashboard: {
          charts: {
            perDay: {
              title: "今天的票务：",
            },
          },
        },
        connections: {
          title: "连接",
          toasts: {
            deleted: "WhatsApp连接已成功删除！",
            disconnected: "连接已成功断开！",
          },
          confirmationModal: {
            deleteTitle: "删除",
            deleteMessage: "你确定吗？这无法恢复。",
            disconnectTitle: "断开连接",
            disconnectMessage: "你确定吗？你需要重新扫描二维码。",
          },
          buttons: {
            add: "添加WhatsApp",
            disconnect: "断开连接",
            tryAgain: "再试一次",
            qrcode: "二维码",
            newQr: "新二维码",
            connecting: "连接中",
          },
          toolTips: {
            disconnected: {
              title: "无法启动WhatsApp会话",
              content:
                "请确保你的手机已连接到互联网，然后再试一次，或者请求新的二维码。",
            },
            qrcode: {
              title: "等待扫描二维码",
              content:
                "点击“二维码”按钮并用手机扫描二维码以开始会话。",
            },
            connected: {
              title: "连接已建立",
            },
            timeout: {
              title: "与手机的连接已丢失",
              content:
                "请确保你的手机已连接到互联网并且WhatsApp已打开，或者点击“断开连接”按钮获取新的二维码。",
            },
          },
          table: {
            name: "名称",
            status: "状态",
            lastUpdate: "最后更新",
            default: "默认",
            actions: "操作",
            session: "会话",
          },
        },
        whatsappModal: {
          title: {
            add: "添加WhatsApp",
            edit: "编辑WhatsApp",
          },
          form: {
            name: "名称",
            default: "默认",
          },
          buttons: {
            okAdd: "添加",
            okEdit: "保存",
            cancel: "取消",
          },
          success: "WhatsApp已成功保存。",
        },
        qrCode: {
          message: "扫描二维码以开始会话",
        },
        contacts: {
          title: "联系人",
          toasts: {
            deleted: "联系人已成功删除！",
          },
          searchPlaceholder: "搜索 ...",
          confirmationModal: {
            deleteTitle: "删除",
            importTitlte: "导入联系人",
            deleteMessage:
              "你确定要删除此联系人吗？所有相关的票务将会丢失。",
            importMessage: "你想从手机导入所有联系人吗？",
          },
          buttons: {
            import: "导入联系人",
            add: "添加联系人",
          },
          table: {
            name: "姓名",
            whatsapp: "WhatsApp",
            email: "电子邮件",
            actions: "操作",
          },
        },
        contactModal: {
          title: {
            add: "添加联系人",
            edit: "编辑联系人",
          },
          form: {
            mainInfo: "联系人详情",
            extraInfo: "附加信息",
            name: "姓名",
            number: "WhatsApp号码",
            email: "电子邮件",
            extraName: "字段名称",
            extraValue: "值",
          },
          buttons: {
            addExtraInfo: "添加信息",
            okAdd: "添加",
            okEdit: "保存",
            cancel: "取消",
          },
          success: "联系人已成功保存。",
        },
        queueModal: {
          title: {
            add: "添加队列",
            edit: "编辑队列",
          },
          form: {
            name: "名称",
            color: "颜色",
            greetingMessage: "问候信息",
          },
          buttons: {
            okAdd: "添加",
            okEdit: "保存",
            cancel: "取消",
          },
        },
        userModal: {
          title: {
            add: "添加用户",
            edit: "编辑用户",
          },
          form: {
            name: "姓名",
            email: "电子邮件",
            password: "密码",
            profile: "个人资料",
          },
          buttons: {
            okAdd: "添加",
            okEdit: "保存",
            cancel: "取消",
          },
          success: "用户已成功保存。",
        },
        chat: {
          noTicketMessage: "选择一个票务开始聊天。",
        },
        ticketsManager: {
          buttons: {
            newTicket: "新建",
          },
        },
        ticketsQueueSelect: {
          placeholder: "队列",
        },
        tickets: {
          toasts: {
            deleted: "你所在的票务已被删除。",
          },
          notification: {
            message: "来自",
          },
          tabs: {
            open: { title: "收件箱" },
            closed: { title: "已解决" },
            search: { title: "搜索" },
          },
          search: {
            placeholder: "搜索票务和消息。",
          },
          buttons: {
            showAll: "所有",
            quickmessageflash: "快速消息",
          },
        },
        transferTicketModal: {
          title: "转移票务",
          fieldLabel: "输入搜索用户",
          noOptions: "未找到此名称的用户",
          buttons: {
            ok: "转移",
            cancel: "取消",
          },
        },
        ticketsList: {
          pendingHeader: "队列",
          assignedHeader: "处理中",
          noTicketsTitle: "这里什么都没有！",
          noTicketsMessage: "没有找到具有此状态或搜索条件的票务。",
          buttons: {
            accept: "接受",
          },
        },
        newTicketModal: {
          title: "创建票务",
          fieldLabel: "输入搜索联系人",
          add: "添加",
          buttons: {
            ok: "保存",
            cancel: "取消",
          },
        },
        mainDrawer: {
          listItems: {
            dashboard: "仪表盘",
            connections: "连接",
            tickets: "票务",
            contacts: "联系人",
            queues: "队列",
            administration: "管理",
            users: "用户",
            settings: "设置",
          },
          appBar: {
            user: {
              profile: "个人资料",
              logout: "退出",
            },
          },
        },
        notifications: {
          noTickets: "没有通知。",
        },
        queues: {
          title: "队列",
          table: {
            name: "名称",
            color: "颜色",
            greeting: "问候信息",
            actions: "操作",
          },
          buttons: {
            add: "添加队列",
          },
          confirmationModal: {
            deleteTitle: "删除",
            deleteMessage:
              "你确定吗？这无法恢复！该队列中的票务将仍然存在，但不会分配任何队列。",
          },
        },
        queueSelect: {
          inputLabel: "队列",
        },
        users: {
          title: "用户",
          table: {
            name: "姓名",
            email: "电子邮件",
            profile: "个人资料",
            actions: "操作",
          },
          buttons: {
            add: "添加用户",
          },
          toasts: {
            deleted: "用户已成功删除。",
          },
          confirmationModal: {
            deleteTitle: "删除",
            deleteMessage:
              "所有用户数据将丢失。用户的开放票务将移至队列中。",
          },
        },
        settings: {
          success: "设置已成功保存。",
          title: "设置",
          settings: {
            userCreation: {
              name: "用户创建",
              options: {
                enabled: "启用",
                disabled: "禁用",
              },
            },
          },
        },
        messagesList: {
          header: {
            assignedTo: "分配给：",
            buttons: {
              return: "返回",
              resolve: "解决",
              reopen: "重新打开",
              accept: "接受",
            },
          },
        },
        messagesInput: {
          placeholderOpen: "输入消息",
          placeholderClosed: "重新打开或接受此票务以发送消息。",
          signMessage: "签名",
        },
        contactDrawer: {
          header: "联系人详情",
          buttons: {
            edit: "编辑联系人",
          },
          extraInfo: "其他信息",
        },
        ticketOptionsMenu: {
          delete: "删除",
          transfer: "转移",
          confirmationModal: {
            title: "删除票务 #",
            titleFrom: "来自联系人 ",
            message: "注意！所有相关消息将丢失。",
          },
          buttons: {
            delete: "删除",
            cancel: "取消",
          },
        },
        confirmationModal: {
          buttons: {
            confirm: "确认",
            cancel: "取消",
          },
        },
        messageOptionsMenu: {
          delete: "删除",
          reply: "回复",
          confirmationModal: {
            title: "删除消息？",
            message: "此操作无法恢复。",
          },
        },
        backendErrors: {
          ERR_NO_OTHER_WHATSAPP:
            "必须至少有一个默认的WhatsApp连接。",
          ERR_NO_DEF_WAPP_FOUND:
            "未找到默认的WhatsApp。检查连接页面。",
          ERR_WAPP_NOT_INITIALIZED:
            "此WhatsApp会话未初始化。检查连接页面。",
          ERR_WAPP_CHECK_CONTACT:
            "无法检查WhatsApp联系人。检查连接页面。",
          ERR_WAPP_INVALID_CONTACT: "这不是一个有效的WhatsApp号码。",
          ERR_WAPP_DOWNLOAD_MEDIA:
            "无法从WhatsApp下载媒体。检查连接页面。",
          ERR_INVALID_CREDENTIALS: "认证错误。请再试一次。",
          ERR_SENDING_WAPP_MSG:
            "发送WhatsApp消息时出错。检查连接页面。",
          ERR_DELETE_WAPP_MSG: "无法删除WhatsApp消息。",
          ERR_OTHER_OPEN_TICKET:
            "此联系人已有一个开放的票务。",
          ERR_SESSION_EXPIRED: "会话已过期。请登录。",
          ERR_USER_CREATION_DISABLED:
            "用户创建已被管理员禁用。",
          ERR_NO_PERMISSION: "你没有权限访问此资源。",
          ERR_DUPLICATED_CONTACT: "此号码已存在联系人。",
          ERR_NO_SETTING_FOUND: "未找到此ID的设置。",
          ERR_NO_CONTACT_FOUND: "未找到此ID的联系人。",
          ERR_NO_TICKET_FOUND: "未找到此ID的票务。",
          ERR_NO_USER_FOUND: "未找到此ID的用户。",
          ERR_NO_WAPP_FOUND: "未找到此ID的WhatsApp。",
          ERR_CREATING_MESSAGE: "创建消息时出错。",
          ERR_CREATING_TICKET: "创建票务时出错。",
          ERR_FETCH_WAPP_MSG:
            "获取WhatsApp消息时出错，可能该消息已过时。",
          ERR_QUEUE_COLOR_ALREADY_EXISTS:
            "此颜色已被使用，请选择其他颜色。",
          ERR_WAPP_GREETING_REQUIRED:
            "如果有多个队列，则需要问候信息。",
        },
      },
    },
  };
  
  export { messages };
  