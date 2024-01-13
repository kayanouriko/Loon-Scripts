const api = {
    login: '/auth/login',
    checkin: '/user/checkin'
}

const http = {
    successCode: 1,
    post(request) {
        return new Promise((resolve, reject) => {
            $httpClient.post(request, (error, response, data) => {
                if (error) {
                    reject(error)
                } else {
                    resolve({ response, data })
                }
            })
        })
    }
}

const storage = {
    local: {
        url: 'cc.kayanouriko.sspanel.url',
        username: 'cc.kayanouriko.sspanel.username',
        password: 'cc.kayanouriko.sspanel.password'
    },
    read(key) {
        return $persistentStore.read(key)
    }
}

const notify = {
    content: {
        value: '请到插件主页填写参数后运行.',
        cookie: '获取不到 cookie.',
        login: '登录失败.',
        checkin: '签到成功, 但是没有获取正确的签到内容.',
        failure: '签到失败.'
    },
    post(content) {
        $notification.post('SSPanel 每日签到', '', content, {
            mediaUrl: 'https://raw.githubusercontent.com/kayanouriko/Loon-Scripts/main/src/sspanel/assets/logo.jpg'
        })
    }
}

main()

/** 主入口 */
async function main() {
    try {
        // 检测本地存储参数是否已经填写
        const { url, username, password } = checkStorage()
        // 登录
        const cookie = await login(url, username, password)
        // 签到
        const result = await checkin(url, cookie)
        // 通知
        notify.post(result)
    } catch (error) {
        notify.post('发生错误: ' + error.message || error)
    } finally {
        $done()
    }
}

/**
 * 检查所需参数是否已经填写
 */
function checkStorage() {
    const url = storage.read(storage.local.url) || ''
    const username = storage.read(storage.local.username) || ''
    const password = storage.read(storage.local.password) || ''
    if (url.length === 0 || username.length === 0 || password.length === 0) {
        throw new Error(notify.content.value)
    }
    return { url, username, password }
}

/**
 * 登录逻辑
 * @param {string} url
 * @param {string} email
 * @param {string} passwd
 * @returns {string} cookie
 */
async function login(url, email, passwd) {
    const request = {
        url: url + api.login,
        headers: {
            'Content-Type': 'application/json; charset=UTF-8'
        },
        body: {
            email,
            passwd
        }
    }
    const { response, data } = await http.post(request)
    const { ret, msg } = JSON.parse(data)
    if (ret === http.successCode) {
        const setCookie = response.headers['set-cookie']
        if (setCookie && setCookie.length > 0) {
            const regex = /(uid|email|key|ip|expire_in)=.*?(?=;)/g
            const cookies = setCookie.match(regex)
            if (cookies) {
                return 'lang=zh-cn; ' + cookies.join('; ')
            }
        }
        throw new Error(notify.content.cookie)
    }
    throw new Error(msg || notify.content.login)
}

/**
 * 签到
 * @param {string} cookie
 */
async function checkin(url, cookie) {
    const request = {
        url: url + api.checkin,
        headers: {
            Cookie: cookie
        }
    }
    const { data } = await http.post(request)
    const { ret, msg } = JSON.parse(data)
    if (ret === http.successCode) {
        return msg || notify.content.checkin
    }
    throw new Error(msg || notify.content.failure)
}
