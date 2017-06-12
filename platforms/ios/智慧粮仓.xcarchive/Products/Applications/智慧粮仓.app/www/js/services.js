/**
 * Created by Administrator on 2017/3/21.
 */
angular.module('services', [])
    .factory('LoginService', [function () {
        var isLogin = false;

        return {
            set: function () {
                isLogin = !isLogin;
            },

            get: function () {
                return isLogin;
            }

        }
    }])
    .factory('UserService', [function () {
        var userName, userSex, userAge, userAddress, userRole, userPhone;

        return {
            person: {
                userName: userName,
                userSex: userSex,
                userAge: userAge,
                userAddress: userAddress,
                userRole: userRole,
                userPhone: userPhone
            }
        }
    }])
    .factory('LoadingService', ['$ionicLoading', function ($ionicLoading) {

        var show = function () {
            $ionicLoading.show({
                template: '<ion-spinner icon="ios" class="spinner-balanced"></ion-spinner><p>loading</p>',
                animation: 'fade-in',
                showBackdrop: true,
                maxWidth: 300,
                showDelay: 0
            });
        };
        var hide = function () {
            $ionicLoading.hide();
        };
        return {
            show: show,
            hide: hide
        };


    }])
    .factory('PopupService', ['$ionicPopup', function ($ionicPopup) {

        var myTitle = "<h4>提示</h4>";
        var myContent = "";
        var myBody = "<p style='color: #108678;width: 80%;margin: auto;text-align: center'>" + myContent + "</p>";
        var showAlert = function () {
            var alertPopup = $ionicPopup.alert({
                title: myTitle,
                template: myBody,
                okText: '确认',
                okType: 'button-royal'
            });

        };
        var setTitle = function (title) {
            myTitle = title;
        };
        var setContent = function (content) {
            myContent = content;
            myBody = "<p style='color: #108678;width: 80%;margin: auto;text-align: center'>" + myContent + "</p>";
        };
        // 自定义弹窗
        var showPopup = function (myTap) {
            var myPopup = $ionicPopup.show({
                title: myTitle,
                template: myBody,

                buttons: [
                    {
                        text: '<b>确认</b>',
                        type: 'button-royal',
                        onTap: function (e) {
                            myTap();
                        }
                    }
                ]
            });
        };
        var showYNPopup = function (myYNTap) {
            var myYNPopup = $ionicPopup.show({
                title: myTitle,
                template: myBody,
                buttons: [
                    {
                        text: '<b>否</b>',
                        type: 'button-royal',
                        onTap: function (e) {
                        }
                    },
                    {
                        text: '<b>是</b>',
                        type: 'button-royal',
                        onTap: function (e) {
                            myYNTap();
                        }
                    }
                ]
            });
        };

        return {
            showAlert: showAlert,
            showPopup: showPopup,
            setTitle: setTitle,
            setContent: setContent,
            showYNPopup: showYNPopup
        };
    }])
    .factory('ConfirmService', [function () {
        var detail = "";
        var flag = "";
        var alarmId = 1;
        return {
            detail: detail,
            flag: flag,
            alarmId: alarmId
        };
    }])
    .factory('Push', function () {
        var push;
        return {
            setBadge: function (badge) {
                if (push) {
                    console.log('jpush:set badge', badge);
                    plugins.jPushPlugin.setBadge(badge);
                }
            },
            setAlias: function (alias) {
                if (push) {
                    console.log('jpush:set alias', alias);
                    plugins.jPushPlugin.setAlias(alias);
                }
            },
            check: function () {
                if (window.jpush && push) {
                    plugins.jPushPlugin.receiveNotificationIniOSCallback(window.jpush);
                    window.jpush = null;
                }
            },
            init: function (notificationCallback) {
                console.log('jpush: start init-----------------------');
                push = window.plugins && window.plugins.jPushPlugin;
                if (push) {
                    console.log('jpush: init');
                    plugins.jPushPlugin.init();
                    plugins.jPushPlugin.setDebugMode(true);
                    plugins.jPushPlugin.openNotificationInAndroidCallback = notificationCallback;
                    plugins.jPushPlugin.receiveNotificationIniOSCallback = notificationCallback;
                }

            }
        };
    });

