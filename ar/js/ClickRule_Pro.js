//初始化参数
var pm = $("#update").attr("data");
var req = GetRequest(pm);
var _id = req["id"];
if (_id != "") {
    //更新产品浏览次数
    var params = {
        action: "UpdateClick",
        d_mark: 2,
        d_id: _id
    };
    $.ajax({
        type: "post",
        dataType: "json",
        url: "/tools/web_ajax.ashx",
        data: params,
        success: function (date) {
//            if (date.msg == 1) {
//                alert('更新记录成功!');
//            }
        },
        error: function () {
            //alert("数据加载错误!");
        }
    });
}


//封装参数
function GetRequest(_pm) {
    strs = _pm.split("&");
    var theRequest = new Object();
    for (var i = 0; i < strs.length; i++) {
        theRequest[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
    }
    return theRequest;
}