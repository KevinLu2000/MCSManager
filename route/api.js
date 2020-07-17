const router = require('express')();
const serverModel = require('../model/ServerModel');
const userModel = require('../model/UserModel');
const mcPingProtocol = require('../helper/MCPingProtocol');
const apiResponse = require('../helper/ApiResponse');

const fs = require('fs');


// 服务端实例状态获取 | 公共性 API 接口
// 无需任何权限判定
router.all('/status/:name', function (req, res) {
    if (MCSERVER.localProperty.allow_status_api) {
        res.send("管理员禁止此项功能 | Access denied");
        return;
    }
    let params = req.params || {};
    let serverName = params.name || "";
    let mcserver = serverModel.ServerManager().getServer(serverName.trim());
    if (mcserver == null) {
        res.send("null");
        return;
    }
    let sendStatus = null;

    // 取缓存资料
    const mcpingResult = mcPingProtocol.QueryMCPingTask(serverName)

    // 判断服务器启动状态发送不同的数据
    if (mcserver.isRun() && mcpingResult) {
        sendStatus = {
            id: serverName,
            serverName: mcserver.dataModel.mcpingConfig.mcpingName,
            lastDate: mcserver.dataModel.mcpingConfig.lastDate,
            status: mcserver.isRun(),
            current_players: mcpingResult.current_players,
            max_players: mcpingResult.max_players,
            motd: mcserver.dataModel.mcpingConfig.mcpingMotd || mcpingResult.motd,
            version: mcpingResult.version
        };
    } else {
        sendStatus = {
            id: serverName,
            lastDate: mcserver.dataModel.lastDate,
            status: mcserver.isRun(),
        };
    }

    res.send(JSON.stringify(sendStatus));
    res.end();
});


// 创建实例 API
router.post('/create_server', function (req, res) {
    // 解析请求参数
    const params = JSON.parse(req.body);
    const result = serverModel.createServer(params);

    // 返回状态码
    result ? apiResponse.ok(res) : apiResponse.error(res);

});


// 删除实例 API
router.all('/delete_server/:name', function (req, res) {
    // 解析请求参数
    const params = req.params.name;
    try {
        const result = serverModel.deleteServer(params);
        apiResponse.ok(res);
    } catch (err) {
        apiResponse.error(res, err);
    }
    res.end();
});


// 创建用户 API
// params.username
// params.password
// params.serverList
router.post('/create_user', function (req, res) {
    try {
        // 解析请求参数
        const params = JSON.parse(req.body);
        // 注册用户
        userModel.userCenter().register(params.username, params.password);
        // 注册其名下的服务端实例
        userModel.userCenter().get(params.username).allowedServer(params.serverList);
        // 数据模型保存
        userModel.userCenter().get(username).dataModel.save();
        // 返回状态码
        apiResponse.ok(res);
    } catch (err) {
        apiResponse.error(res, err);
    }
});


// 删除用户 API
router.post('/delete_user/:name', function (req, res) {
    try {
        // 解析请求参数
        const userName = req.params.name;
        // 注册用户
        userModel.userCenter().deleteUser(userName);
        // 返回状态码
        apiResponse.ok(res);
    } catch (err) {
        apiResponse.error(res, err);
    }
});




//模块导出
module.exports = router;