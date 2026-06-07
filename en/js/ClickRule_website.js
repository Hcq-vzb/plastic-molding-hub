
//更新浏览次数
var params = {
    action: "UpdateClick",
    d_mark: 1,
    d_id: 0
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
