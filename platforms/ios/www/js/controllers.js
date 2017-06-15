/**
 * Created by Administrator on 2017/5/8.
 */
angular.module('controllers', [])

  .controller('MainCtrl', ['$scope', '$state', '$rootScope', 'LoginService', '$cordovaNetwork', '$cordovaToast',
    function ($scope, $state, $rootScope, LoginService, $cordovaNetwork, $cordovaToast) {

      var state = 0;

      $rootScope.$on('$stateChangeStart', function (event, toState) {
        if (toState.name == 'login' || toState.name == 'start') {
          return;
        }
        // if(!LoginService.get()){
        //   event.preventDefault();// 取消默认跳转行为
        //   $state.go("login");//跳转到登录界面
        // }
      });

      // 监听手机网络在线事件
      $rootScope.$on('$cordovaNetwork:online', function (event, networkState) {
        if (state != 0) {
          if (networkState == Connection.WIFI) {
            $cordovaToast.showLongBottom("手机重新连接上wifi网络");
          } else {
            $cordovaToast.showLongBottom("手机正在使用非wifi网络");
          }
        }

      });
      // 监听手机网络离线事件
      $rootScope.$on('$cordovaNetwork:offline', function (event, networkState) {
        $cordovaToast.showLongBottom("手机网络断开了");
        state++;
      })

    }])
  .controller('StartCtrl', ['$scope', '$state',
    function ($scope, $state) {
      $scope.myActiveSlide = 0;
      $scope.enter = function () {
        $state.go("login");
      }


    }])
  .controller('TabsCtrl', ['$scope', '$rootScope', '$http', '$ionicTabsDelegate', '$ionicSlideBoxDelegate',
    function ($scope, $rootScope, $http, $ionicTabsDelegate, $ionicSlideBoxDelegate) {

      $rootScope.badges = {
        news: 0
      };
      $rootScope.getNews = function () {
        $http.get('http://123.56.27.166:8080/barn_application/alarm/getAlarmSumByUID?UID=' + localStorage.userId)
          .then(function (resp) {
            $rootScope.myNews = 0;
            $rootScope.total = resp.data.length;
            for (i = 0; i < resp.data.length; i++) {
              if (resp.data[i].status == "true") {
                $rootScope.myNews++;
              }

            }
            $rootScope.badges.news = $rootScope.myNews;
            if ($rootScope.badges.news > 99) {
              $rootScope.badges.news = "99+"
            }
          }, function (error) {

          });
      };
      $rootScope.getNews();
      setInterval(function () {
        $rootScope.getNews();
      }, 1000 * 60);

    }])
  .controller('LoginCtrl', ['$scope', '$state', '$http', 'PopupService', 'LoadingService', 'UserService', 'LoginService', 'BarnService',
    function ($scope, $state, $http, PopupService, LoadingService, UserService, LoginService, BarnService) {
      $scope.ctrlScope = $scope;
      if (localStorage.getItem("password") == "" || localStorage.password == null) {
        $scope.name = "";
        $scope.password = "";
      } else {
        $scope.name = localStorage.getItem("userId");
        $scope.password = localStorage.getItem("password");
      }
      $scope.login = function () {
        if ($scope.name == "" || $scope.password == "") {
          PopupService.setContent("用户名或密码不能为空");
          PopupService.showAlert();
          return;
        }
        LoadingService.show();

        $http.get('http://123.56.27.166:8080/barn_application/user/login?UID=' + $scope.name + '&password=' + $.md5($scope.password))
          .then(function (resp) {
            if (resp.data.state == 1) {
              localStorage.userId = $scope.name;
              LoginService.set();
              //   window.plugins.jPushPlugin.setAlias($scope.name);
              if (document.getElementById("remember").checked == true) {
                localStorage.password = $scope.password;
              } else {
                localStorage.password = "";
              }
              getInfo();
            } else {
              LoadingService.hide();
              PopupService.setContent("用户名或密码错误");
              PopupService.showAlert();
            }

          }, function (error) {
            LoadingService.hide();
            PopupService.setContent("服务器连接失败，请检查您的网络，然后重试");
            PopupService.showAlert();
          });

      };

      var getInfo = function () {
        $http.get('http://123.56.27.166:8080/barn_application/user/getUserByUID?UID=' + $scope.name)
          .then(function (resp) {
            UserService.person.userAccount = localStorage.userId;
            UserService.person.userName = resp.data.name;
            UserService.person.userAddress = resp.data.address;
            UserService.person.userAge = resp.data.age;
            UserService.person.userSex = resp.data.sex;
            UserService.person.userPhone = resp.data.telephone;
            getRole();

          }, function (error) {

            LoadingService.hide();
            PopupService.setContent("服务器连接失败，请检查您的网络，然后下拉刷新重试");
            PopupService.showAlert();
          });
      };
      var getRole = function () {
        $http.get('http://123.56.27.166:8080/barn_application/user/getAuthority?UID=' + $scope.name)
          .then(function (resp) {
            UserService.person.userRole = resp.data.role_name;
            getBarns();
          }, function (error) {

            LoadingService.hide();
            PopupService.setContent("服务器连接失败，请检查您的网络，然后下拉刷新重试");
            PopupService.showAlert();
          });
      };
      var getBarns = function () {
        $http.get('http://123.56.27.166:8080/barn_application/barn/getBNIDByUID?UID=' + localStorage.userId)
          .then(function (resp) {
            LoadingService.hide();
            var barns = [];
            for (var i = 0; i < resp.data.length; i++) {
              barns.push({ barnId: resp.data[i].BNID, barnName: resp.data[i].description })
            }
            BarnService.setBarns(barns);
            $state.go("tabs.home");
          }, function (error) {

          });
      }


    }])

  .controller('TemperatureCtrl', ['$scope', '$location', '$http', '$stateParams', 'LoadingService',
    function ($scope, $location, $http, $stateParams, LoadingService) {

      $scope.title = $stateParams.title;

      var id = $stateParams.id;
      $scope.time = "";
      var isOK = 0;
      LoadingService.show();

      // document.getElementById('first-BarnInfo').style.display = "none";
      // document.getElementById('second').style.display = "none";
      document.getElementById('second-alarm').style.display = "none";

      $scope.doRefresh = function () {
        $scope.items = [];
        $scope.$broadcast('scroll.refreshComplete');
      };


      //value作为标志数据，可以进行切换两个图表的标志
      var value = 0;

      //取数据，并且传给echarts图标，其中画图表的部分在drawChart函数中
      $scope.getEchartsData = function () {


        console.log('getEchartsDataid----', id);
        var url = "http://123.56.27.166:8080/barn_application/node/getNodeDataByBNID?BNID=" + id;
        //var url = './js/test66.json';
        $http.get(url).success(function (response) {
          LoadingService.hide();
          $scope.datas = response;
          drawChart(response);
          console.log('success', response);

          console.log('warnTableFuncid----', id);
          var url2 = "http://123.56.27.166:8080/barn_application/alarm/getAlarmDetailByBNID?BNID=" + id + "&timestamp=" + $scope.time;
          $http.get(url2).success(function (responses) {
            var data = responses;
            console.log("url2", url2);
            console.log("alarm", responses);
            console.log("time的值是啥", $scope.time);
            console.log("time类型", typeof ($scope.time));
            $scope.highTemp = 0;
            $scope.hotTemp = 0;
            $scope.dontIn = 0;
            $scope.tooQuick = 0;
            $scope.record = [];
            for (var i = 0; i < data.length - 1; i++) {
              var item = [data[i].location_x, data[i].location_y, data[i].depth, data[i].data, data[i].alarm_type_name];
              $scope.record.push(item);
              switch (data[i].alarm_type_name) {
                case "温升过快":
                  $scope.tooQuick++;
                  break;
                case "电缆未埋入粮堆":
                  $scope.dontIn++;
                  break;
                case "发热":
                  $scope.hotTemp++;
                  break;
                case "高温":
                  $scope.highTemp++;
                  break;
                default:
                  break;
              }
            }
          })
        })
      }
      $scope.listFunc = function () {
        // var id = $stateParams.id;
        console.log('listFuncid----', id);
        var url = "http://123.56.27.166:8080/barn_application/node/getSummaryDataByTimestamp?BNID=" + id;
        $http.get(url).success(function (response) {
          var datas = response[0].list;
          $scope.deviceId = response[0].deviceId;
          $scope.barnAverage = response[0].barnAverage;
          $scope.maxBarnValue = response[0].maxBarnValue;
          $scope.minBarnValue = response[0].minBarnValue;
          $scope.records = [];
          for (var i = 0; i < datas.length; i++) {
            var item = [i + 1, datas[i].levelAverage, datas[i].maxLevelValue, datas[i].minLevelValue];
            $scope.records.push(item);
            console.log('listFuncitem?????????', item);
          }
        })
      }

      // $scope.warnTableFunc = function () {
      //   // var id = $stateParams.id;
      //   console.log('warnTableFuncid----', id);
      //   var url = "http://123.56.27.166:8080/barn_application/alarm/getAlarmDetailByBNID?BNID=15&timestamp=2017-06-11%2013:11:39";
      //   $http.get(url).success(function (response) {
      //     var datas = response;
      //     console.log("alarm", response);
      //     console.log("time的值是啥", $scope.time);
      //     console.log("time类型", typeof ($scope.time));
      //     console.log("url", url);
      //     $scope.records = [];
      //     for (var i = 0; i < datas.length - 1; i++) {
      //       var item = [datas[i].location_x, datas[i].location_y, datas[i].depth, datas[i].data, datas[i].alarm_type_name];
      //       $scope.records.push(item);
      //     }
      //   })
      // }

      //试验button的切换页面的功能
      $scope.doChangeEcharts = function () {
        if (value == 1) {
          document.getElementById('second').style.display = "none";
          document.getElementById('second-alarm').style.display = "none";
          document.getElementById('first').style.display = "block";
          document.getElementById('first-BarnInfo').style.display = "block";
          $scope.label = "粮温数据";
          value = value - 1;
          console.log('hello，value=1，显示first，此时的value值已经改变，变成了', value);
        }
        else {
          value = value + 1;
          document.getElementById('second').style.display = "block";
          document.getElementById('second-alarm').style.display = "block";
          document.getElementById('first').style.display = "none";
          document.getElementById('first-BarnInfo').style.display = "none";
          $scope.label = "异常数据汇总";
          console.log('hello，value=0，显示second，此时的value值已经改变，变成了', value);
        }
      }
      //drawChart函数功能部分
      function drawChart(chartdata) {

        var airTemandhum = [];
        var barnTemandhum = [];

        var statistic25 = {}//所有25度在每一层的个数
        var statistic30 = {};//每一层级30-35度的个数
        var statistic35 = {};//所有35度在每一层的个数}
        //timeline 的data动态创建
        var timelineData = [];

        var allresult = {};
        // console.log(chartdata.slice(chartdata.length - 4))
        //更新时间在这儿
        $scope.dateNow = chartdata[0].timestamp;
        $scope.time = chartdata[0].timestamp;
        console.log("时间戳为", $scope.time);
        if ($scope.time) { isOK = 1; }

        for (var i = 0; i < chartdata.length; i++) {

          var temp = chartdata[i].data;

          if (temp === null || temp === undefined) {  //data字段就没有了，为undefined
            temp = 101;
          }
          else {
            temp = parseFloat(temp);
          }

          if (temp > 15 && temp <= 25) {//25-30度每一层的个数
            if (!statistic25[chartdata[i].depth]) {
              statistic25[chartdata[i].depth] = 0;
            }
            statistic25[chartdata[i].depth]++;
          }
          if (temp > 25 && temp <= 35) {///30-35度每一层的个数
            if (!statistic30[chartdata[i].depth]) {
              statistic30[chartdata[i].depth] = 0;
            }
            statistic30[chartdata[i].depth]++;
          }
          if (temp > 35 && temp <= 100) {//>35度每一层的个数
            if (!statistic35[chartdata[i].depth]) {
              statistic35[chartdata[i].depth] = 0;
            }
            statistic35[chartdata[i].depth]++;
          }

          if (chartdata[i].deviceId == 1) {
            airTemandhum.push(chartdata[i].data);
          }

          if (chartdata[i].type == 10 || chartdata[i].type == 11) {
            barnTemandhum.push(chartdata[i].data);
          }

          var item = [chartdata[i].location_x, chartdata[i].location_y, temp, chartdata[i].depth];
          // console.log('item', i, item);

          if (!allresult[chartdata[i].depth]) {
            allresult[chartdata[i].depth] = [];
            timelineData.push(chartdata[i].depth + '层');
          }
          allresult[chartdata[i].depth].push(item);
        }

        $scope.barnTemperature = barnTemandhum[0];
        $scope.barnHumidity = barnTemandhum[1];
        $scope.airTemperature = airTemandhum[0];
        $scope.airHumidity = airTemandhum[1];
        console.log('temandhum------', airTemandhum, barnTemandhum);
        console.log('allresult', allresult);
        var chart2datas = {   //这个为第二个图标需要的数据，l代表黄颜色，m（medium）代表橙色，h代表红色
          l: [],//25-30
          m: [],//30-35
          h: []//>35
        }
        console.log(timelineData);
        for (var i = 1; i < timelineData.length; i++) {// to do 动态添加
          chart2datas["l"].push(statistic25[i] ? statistic25[i] : 0);
          chart2datas["m"].push(statistic30[i] ? statistic30[i] : 0);
          chart2datas["h"].push(statistic35[i] ? statistic35[i] : 0);
        }
        console.log(chart2datas);
        //标签为first的echart的js实现
        // 基于准备好的dom，初始化echarts实例
        var myChart1 = echarts.init(document.getElementById('first'));
        var schema =
          [
            { name: 'corE', index: 0, text: '西向位置' },
            { name: 'corN', index: 1, text: '北向位置' },
            { name: 'temP', index: 2, text: '摄氏温度' },
            { name: 'deeP', index: 3, text: '纵向深度' }
          ];

        var select =
          [
            { name: 'P1', index: 0, text: '东：' },
            { name: 'P2', index: 1, text: '北：' },
            { name: 'P3', index: 1, text: '温：' }

          ];

        var itemStyle =
          {
            normal:
            {
              opacity: 100,
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowOffsetY: 0,
              shadowColor: 'rgba(0, 0, 0, 1)'
            }
          };
        var option1 = {
          //固定框架的option写这
          baseOption: {
            timeline: {
              //loop: false,
              axisType: 'category',
              autoPlay: false,
              bottom: 20,
              label:
              {
                normal:
                {
                  textStyle:
                  {
                    color: '#6B6F72'
                  }
                },
                emphasis: {
                  textStyle: {
                    color: '#6B6F72'
                  }
                }
              },
              symbol: 'none',
              lineStyle: {
                color: '#555'
              },
              checkpointStyle: {
                color: '#bbb',
                borderColor: '#777',
                borderWidth: 2
              },
              controlStyle: {
                showNextBtn: false,
                showPrevBtn: false,
                normal: {
                  color: '#666',
                  borderColor: '#666'
                },
                emphasis: {
                  color: '#aaa',
                  borderColor: '#aaa'
                }
              },
              data: timelineData.slice(0, 5)


            },
            grid: {
              containLabel: true,
              top: 25,
              right: 8
            },
            // title: {
            //     left: 'center',
            //     textStyle: {
            //         color: '#6B6F72'
            //     }
            // },

            backgroundColor: '#F3F3F3',

            color: [
              '#dd4444', '#fec42c', '#80F1BE'
            ],
            //提示框组件，就是浮着的那个
            tooltip: {
              padding: 10,
              backgroundColor: '#222',
              borderColor: '#777',
              borderWidth: 1,
              formatter: function (obj) {
                var value = obj.value;
                if (value[2] == 999) { //如果无效点，data为-999
                  return '<div style="border-bottom: 1px solid rgba(255,255,255,.3); font-size: 18px;padding-bottom: 7px;margin-bottom: 7px">'
                    + obj.seriesName
                    + '</div>'
                    + schema[0].text + '：' + value[0] + '<br>'
                    + schema[1].text + '：' + value[1] + '<br>'
                    + schema[3].text + '：' + value[3] + '<br>'
                    + schema[2].text + '：' + '无效' + '<br>'
                }
                return '<div style="border-bottom: 1px solid rgba(255,255,255,.3); font-size: 18px;padding-bottom: 7px;margin-bottom: 7px">'
                  + obj.seriesName
                  + '</div>'
                  + schema[0].text + '：' + value[0] + '<br>'
                  + schema[1].text + '：' + value[1] + '<br>'
                  + schema[3].text + '：' + value[3] + '<br>'
                  + schema[2].text + '：' + value[2] + '<br>'
              }
            },
            //区域缩放
            dataZoom: [
              {
                type: 'slider',
                show: false,
                yAxisIndex: [0],
                left: '93%',
                top: 50,
                start: 0,
                end: 100,
                zoomLock: true,
                textStyle: {
                  color: '#aed2ff'
                },
                borderColor: '#3c4868',
                width: '26',
                height: '70%',
                handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
                handleSize: '90%',
                labelPrecision: '0',
                dataBackground: {
                  areaStyle: {
                    color: '#222445'
                  },
                  lineStyle: {
                    opacity: 0.8,
                    color: '#222445'
                  }
                },
                handleStyle: {
                  color: '#aed2ff',
                  shadowBlur: 3,
                  shadowColor: 'rgba(0, 0, 0, 0.6)',
                  shadowOffsetX: 2,
                  shadowOffsetY: 2
                }
              },//datazoom第一部分

              {
                type: 'inside',
                yAxisIndex: [0],
                start: 0,
                end: 100,
                zoomLock: true,
                show: true,
                textStyle: {
                  color: '#aed2ff'
                },
                borderColor: '#3c4868',
                top: 50,
                width: '26',
                height: '70%',
                handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
                handleSize: '90%',
                dataBackground: {
                  areaStyle: {
                    color: '#222445'
                  },
                  lineStyle: {
                    opacity: 0.8,
                    color: '#222445'
                  }
                },
                handleStyle: {
                  color: '#aed2ff',
                  shadowBlur: 3,
                  shadowColor: 'rgba(0, 0, 0, 0.6)',
                  shadowOffsetX: 2,
                  shadowOffsetY: 2
                }
              },//datazoom第二部分

              {
                "show": false,
                "height": 23,
                "xAxisIndex": [
                  0
                ],
                labelPrecision: '0',
                top: 30,
                "start": 0,
                "end": 100,
                handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
                handleSize: '110%',
                handleStyle: {
                  color: '#aed2ff',
                  shadowBlur: 3,
                  shadowColor: 'rgba(0, 0, 0, 0.6)',
                  shadowOffsetX: 2,
                  shadowOffsetY: 2
                },
                textStyle: {
                  color: "#fff"
                },
                borderColor: "#90979c"


              },//datazoom第三部分
              {
                "type": "inside",
                "show": true,
                "height": 20,
                "start": 0,
                "end": 100
              }//第四部分

            ],//datazoom结束
            //底部图例
            visualMap: {
              type: "piecewise",
              splitNumber: 5,
              orient: 'horizontal',
              inverse: false,
              right: 0,
              calculable: true,
              dimension: 2,
              textGap: 3,    //这个是每个小矩形数值之间的距离
              itemWidth: 14,
              itemHeight: 12, //itemHeight和itemWidth这两个是指小矩形的宽高
              pieces: [
                { max: 0, color: '#2B6894' },
                { min: 0, max: 15, color: '#84CBF0' }, // 不指定 max，表示 max 为无限大（Infinity）。
                { min: 15, max: 30, color: '#FEEE50' },
                { min: 30, max: 100, color: '#E43125' },
                { value: 101, label: '无效点', color: 'grey' }// 表示 value 等于 123 的情况。
                // 不指定 min，表示 min 为无限大（-Infinity）。
              ],
              textStyle: {
                color: '#6B6F72'
              }
            },

            xAxis: {
              name: '西向',
              nameGap: 5,
              inverse: true,

              nameTextStyle: {
                color: '#6B6F72',
                fontSize: 14
              },
              // max: 5,
              min: 0,
              splitLine: {
                show: true
              },
              axisLine: {
                lineStyle: {
                  color: '#6B6F72'
                }
              }
            },

            yAxis: [{
              name: '北向',
              type: 'value',
              position: 'right',
              nameLocation: 'end',
              nameGap: 5,
              // nameRotate: 90,
              nameTextStyle: {
                color: '#6B6F72',
                fontSize: 16
              },
              min: 0,
              axisLine: {
                lineStyle: {
                  color: '#6B6F72'
                }
              },
              splitLine: {
                show: true
              }
            }],

            series: [
              {
                name: '1号粮囤',
                type: 'scatter',
                xAxisIndex: 0,
                yAxisIndex: 0,
                itemStyle: itemStyle,
                symbolSize: function (value) {  //修改点的大小的
                  if (value[2] == 101)
                  { return Math.round(10); }
                  else if (value[2] > 30)
                  { return Math.round(30); }
                  else if (value[2] < 20)
                  { return Math.round(10); }
                  else { return Math.round(20); }
                }


              }
            ]
          },

          //变化数据写这
          options: function (data) {
            var dataOption = [];
            for (var i = 1; i < data.length; i++) {
              dataOption.push({
                series: [
                  {
                    data: allresult[i]
                  }
                ]
              })
            }
            return dataOption;
          }(timelineData)
        }
        myChart1.setOption(option1);
        $scope.label = "粮温数据";
        window.onresize = myChart1.resize;


        //标签为second的粮温预警的js实现
        // 基于准备好的dom，初始化echarts实例
        var myChart2 = echarts.init(document.getElementById('second'));
        // 指定图表的配置项和数据
        var option = {
          // title: {
          //     text: '异常数据汇总',
          //     left: 'center',
          //     top: 30,
          //     textStyle: {
          //         color: '#3B746D'
          //     }
          // },

          backgroundColor: '#F3F3F3',
          label:
          {
            normal:
            {
              textStyle:
              {
                color: '#000000'
              }
            },
            emphasis: {
              textStyle: {
                color: '#000000'
              }
            }
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {            // 坐标轴指示器，坐标轴触发有效
              type: 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
            }
          },
          color: [
            '#C6381E', '#FF9900', '#FFCC00'//, '#33CC00', '#0099FF'
          ],
          legend: {

            top: '90%',
            right: 0,
            textStyle:
            {
              color: '#000000',
              fontWeight: 'lighter'
            },

            data: ['>35℃', '[35℃,25℃)', '[25℃,15℃)'] //这个要是改的话，下面也得改，seris的name也得相应改变，并且筛选数据的时候的条件也得变
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '10%',
            width: '90%',
            height: '85%',         //这个位置是修改里面的图标的大小的
            top: 10,
            containLabel: true
          },
          xAxis: {
            splitLine: {
              show: false
            },
            //不显示刻度线分割
            axisTick: {
              show: false
            },
            axisLine: {
              lineStyle: {
                color: 'gray'

              }
            },
            type: 'value'
          },
          yAxis: {
            axisLine: {
              lineStyle: {
                color: 'gray'
              }
            },
            //不显示刻度线分割
            axisTick: {
              show: false
            },
            splitLine: {
              show: false
            }
            ,
            type: 'category',
            data: timelineData.slice(0, 5)
          },
          series: [
            {
              name: '>35℃',
              type: 'bar',
              stack: '总量',
              barWidth: 30,
              // label: {
              //     normal: {
              //         show: true,
              //         position: 'insideRight'
              //     }
              // },
              data: chart2datas["h"]
            },
            {
              name: '[35℃,25℃)',
              type: 'bar',
              stack: '总量',
              barWidth: 30,
              // label: {
              //     normal: {
              //         show: true,
              //         position: 'insideRight'
              //     }
              // },
              data: chart2datas["m"]
            },
            {
              name: '[25℃,15℃)',
              type: 'bar',
              stack: '总量',
              barWidth: 30,
              // label: {
              //     normal: {
              //         show: true,
              //         position: 'insideRight'
              //     }
              // },
              data: chart2datas["l"]
            }
          ]
        };
        // 使用刚指定的配置项和数据显示图表。
        myChart2.setOption(option);
        window.onresize = myChart2.resize;
      }

    }

  ])
  .controller('HomeCtrl', ['$scope', '$state', '$http', 'LoadingService', 'PopupService', '$rootScope',
    function ($scope, $state, $http, LoadingService, PopupService, $rootScope) {
      $scope.loading = true;
      $scope.items = [];
      $scope.size = [];
      $scope.depotType = [];
      $scope.long = [];
      $scope.width = [];
      $scope.height = [];
      $scope.intro = {};
      $scope.borderBottom = [];
      $scope.loadFailedText = "";

      LoadingService.show();
      $rootScope.getNews();

      /* $scope.enter=function(){
           LoadingService.show();
           $http.get('http://123.56.27.166:8080/barn_application/barn/getBNIDByUID?UID='+$scope.userId)
               .then(function(resp){
                 //  document.getElementById("loading").style.display="none";
                   LoadingService.hide();
                   $scope.loadFailedText="";
                   $scope.items=[];
                   if(resp.data[0].state==1){
                       // 因为后台可能会返回空数据，所以要做一个判断，防止程序崩溃
                   }else {
                       for (i = 0; i < resp.data.length; i++) {
                           var depotName, num, type,description;
                           depotName = resp.data[i].BNID + "号仓";
                           num = resp.data[i].BNID;
                           description = resp.data[i].description;
                           if (resp.data[i].BNType == "circle") {
                               type = "circle";
                           }
                           if (resp.data[i].BNType == "rectangle") {
                               type = "square";
                           }
                           if(resp.data.length%2==0){
                               if(i==resp.data.length-2 || i==resp.data.length-1){
                                   $scope.borderBottom.push("transparent");
                               }else{
                                   $scope.borderBottom.push("1px solid #bcbcbc");
                               }
                           }else{
                               if(i==resp.data.length-1){
                                   $scope.borderBottom.push("transparent");
                               }else{
                                   $scope.borderBottom.push("1px solid #bcbcbc");
                               }
                           }

                           $scope.items.push({depotName: depotName, num: num, type: type,description:description});
                           if (type == "circle") {
                               $scope.depotType.push("img/icon-circle-depot.png");
                           }
                           if (type == "square") {
                               $scope.depotType.push("img/icon-square-depot.png");
                           }
                           $scope.size[i] = resp.data[i].size.split("/");
                           $scope.long[i] = $scope.size[i][0];
                           $scope.width[i] = $scope.size[i][1];
                           $scope.height[i] = $scope.size[i][2];
                       }

                   }

               },function(error){
                   LoadingService.hide();
                   PopupService.setContent("服务器连接失败，请检查您的网络，然后下拉刷新重试");
                   PopupService.showAlert();
                   if($scope.items.length==0){
                       $scope.loadFailedText="数据加载失败";
                   }

               });
       };*/
      $scope.enter = function () {
        LoadingService.show();
        $http.get('http://123.56.27.166:8080/barn_application/barn/getBarnHouseByUID?UID=' + localStorage.userId)
          .then(function (resp) {
            //  document.getElementById("loading").style.display="none";
            $scope.items = [];
            if (resp.data.length == 0) {
              $scope.loadFailedText = "已没有更多数据";
            } else {
              if (resp.data[0].state == 1) {
                // 因为后台可能会返回空数据，所以要做一个判断，防止程序崩溃
                $scope.loadFailedText = "已没有更多数据";
              }
              else {
                var storageId = resp.data[0].storage_id;
                $scope.loadFailedText = "";
                for (i = 0; i < resp.data.length; i++) {
                  var depotName, num, type, description;
                  if (parseInt(resp.data[i].description.slice(0, 1))) {
                    depotName = resp.data[i].description.slice(0, 2) + "仓";
                    description = resp.data[i].description.slice(2);
                  } else {
                    depotName = resp.data[i].description.slice(0, 1) + "仓";
                    description = resp.data[i].description.slice(1);
                  }
                  num = resp.data[i].id;
                  if (resp.data[i].type == 2) {
                    type = "circle";
                  }
                  if (resp.data[i].type == 1) {
                    type = "square";
                  }
                  if (resp.data.length % 2 == 0) {
                    if (i == resp.data.length - 2 || i == resp.data.length - 1) {
                      $scope.borderBottom.push("transparent");
                    } else {
                      $scope.borderBottom.push("1px solid #bcbcbc");
                    }
                  } else {
                    if (i == resp.data.length - 1) {
                      $scope.borderBottom.push("transparent");
                    } else {
                      $scope.borderBottom.push("1px solid #bcbcbc");
                    }
                  }

                  $scope.items.push({ depotName: depotName, num: num, type: type, description: description });
                  if (type == "circle") {
                    $scope.depotType.push("img/icon-circle-depot.png");
                  }
                  if (type == "square") {
                    $scope.depotType.push("img/icon-square-depot.png");
                  }
                  $scope.size[i] = resp.data[i].size.split("/");
                  $scope.long[i] = $scope.size[i][0];
                  $scope.width[i] = $scope.size[i][1];
                  if ($scope.size[i].length <= 2) {
                    $scope.height[i] = 5;
                  } else {
                    $scope.height[i] = $scope.size[i][2];
                  }

                }
                getIntro(storageId);

              }
            }

          }, function (error) {
            LoadingService.hide();
            PopupService.setContent("服务器连接失败，请检查您的网络，然后下拉刷新重试");
            PopupService.showAlert();
            if ($scope.items.length == 0) {
              $scope.loadFailedText = "数据加载失败";
            }

          });
      };
      var getIntro = function (storageId) {
        $http.get('http://123.56.27.166:8080/barn_application/barn/getStorageById?storage_id=' + storageId)
          .then(function (resp) {
            LoadingService.hide();
            $scope.intro.name = resp.data[0].name;
            $scope.intro.location = resp.data[0].location;

          }, function (error) {
            LoadingService.hide();
            PopupService.setContent("服务器连接失败，请检查您的网络，然后下拉刷新重试");
            PopupService.showAlert();
          });
      };

      $scope.enter();


      $scope.click = function (num, description, i) {

        $state.go('tabs.detail',
          { title: $scope.items[i].depotName, number: num, long: $scope.long[i], width: $scope.width[i], height: $scope.height[i], description: description });
      };

      $scope.doRefresh = function () {
        $scope.enter();
        $scope.$broadcast('scroll.refreshComplete');
      };

    }])
  .controller('TableCtrl', ['$scope', '$state',
    function ($scope, $state) {
      $scope.items = [
        { icon: "img/table-icon-plan.png", name: "计划完成报表" },
        { icon: "img/table-icon-drug.png", name: "仓库管理报表" },
        { icon: "img/table-icon-detail.png", name: "历史数据汇总" },
        { icon: "img/table-icon-total.png", name: "历史数据查询" }
      ];
      $scope.icons = ["img/table-icon-plan.png", "img/table-icon-drug.png", "img/table-icon-detail.png", "img/table-icon-total.png"];
      $scope.iconsLight = ["img/table-icon-plan-light.png", "img/table-icon-drug-light.png", "img/table-icon-detail-light.png", "img/table-icon-total-light.png"];
      $scope.nextPage = ["", "", "tabs.line", ""];
      $scope.goNextPage = function (n) {
        $state.go($scope.nextPage[n]);
      };
      $scope.onTouch = function (n) {
        var parent = document.getElementById("table").getElementsByTagName("div")[n];
        var yellowBar = parent.getElementsByTagName("span")[0];
        var name = parent.getElementsByTagName("span")[1];
        var arrow = parent.getElementsByTagName("i")[0];
        parent.style.backgroundColor = "#108578";
        $scope.items[n].icon = $scope.iconsLight[n];
        yellowBar.style.backgroundColor = "#e0b752";
        name.style.color = "#ffffff";
        arrow.style.color = "#ffffff";

      };
      $scope.onRelease = function (n) {
        var parent = document.getElementById("table").getElementsByTagName("div")[n];
        var yellowBar = parent.getElementsByTagName("span")[0];
        var name = parent.getElementsByTagName("span")[1];
        var arrow = parent.getElementsByTagName("i")[0];
        parent.style.backgroundColor = "#f8faf9";
        $scope.items[n].icon = $scope.icons[n];
        yellowBar.style.backgroundColor = "";
        name.style.color = "#000000";
        arrow.style.color = "#b9b9bb";

      };

    }])
  .controller('DetailCtrl', ['$scope', '$state', '$stateParams', '$window', '$timeout', '$http', 'PopupService', 'LoadingService', 'UserService',
    function ($scope, $state, $stateParams, $window, $timeout, $http, PopupService, LoadingService, UserService) {

      var number = $stateParams.number;
      var userId = localStorage.getItem("userId");
      $scope.table = {};
      $scope.phonenum = UserService.person.userPhone;
      $scope.table.description = $stateParams.description;
      $scope.long = $stateParams.long;
      $scope.width = $stateParams.width;
      $scope.height = $stateParams.height;
      $scope.table.title = $stateParams.title;
      $scope.noMore = false;
      $scope.loadText = "继续拖动，查看小仓库";
      $scope.items = [];
      $scope.persons = [];
      $scope.userRole = UserService.person.userRole;
      $scope.userName = UserService.person.userName;
      $scope.display = "none";
      $scope.loadFailedText = "";
      LoadingService.show();
      var k = 0;

      /*$scope.enter=function(){
          LoadingService.show();
          $http.get('http://123.56.27.166:8080/barn_application/barn/getBarnByBNID?BNID='+number)
              .then(function(resp){
                  $scope.items = [];
                  LoadingService.hide();
                  $scope.loadText = "继续拖动，查看小仓库";
                  $scope.noMore = false;
                  $scope.display="block";
                  $scope.loadFailedText="";
                  var leftBigText,rightGrayText,barnId;
                  if(resp.data.length<=1){
                    $scope.noMore = true;
                    $scope.loadText = "已没有更多数据";
                  }
                  for(i=0;i<resp.data.length;i++){

                      if(i==0)leftBigText="小仓一";
                      if(i==1)leftBigText="小仓二";
                      if(i==2)leftBigText="小仓三";
                      if(i==3)leftBigText="小仓四";
                      if(i==3)leftBigText="小仓五";

                      rightGrayText="最大库存"+resp.data[i].volumn+"t";
                      barnId = resp.data[i].barn_cell_id;
                      $scope.items.push( {leftBigText:leftBigText,leftSmallText:'（种类/稻谷）',rightGrayText:rightGrayText,rightBlackText:'当前库存700t',barnId:barnId})
                  }
              },function(error){
                  LoadingService.hide();
                  PopupService.setContent("服务器连接失败，请检查您的网络，然后下拉刷新重试");
                  PopupService.showAlert();
                  $scope.display="none";
                  if($scope.items.length==0){
                      $scope.loadFailedText="数据加载失败";
                  }
              });
      };*/

      $scope.enter = function () {
        LoadingService.show();
        k = 0;
        $http.get('http://123.56.27.166:8080/barn_application/barn/getBarnByUIDAndBarnHouseID?UID=' + localStorage.userId + '&barn_house_id=' + number)
          .then(function (resp) {
            $scope.items = [];
            $scope.persons = [];
            $scope.loadText = "继续拖动，查看小仓库";
            $scope.noMore = false;
            $scope.display = "block";
            $scope.loadFailedText = "";
            var leftBigText, rightGrayText, barnId;
            if (resp.data.length <= 1) {
              $scope.noMore = true;
              $scope.loadText = "已没有更多数据";
            }
            for (i = 0; i < resp.data.length; i++) {

              /* if(i==0)leftBigText="小仓一";
               if(i==1)leftBigText="小仓二";
               if(i==2)leftBigText="小仓三";
               if(i==3)leftBigText="小仓四";
               if(i==4)leftBigText="小仓五";*/

              leftBigText = resp.data[i].description;
              rightGrayText = "最大库存" + resp.data[i].volume + "t";
              barnId = resp.data[i].BNID;
              getManagerInfo(barnId);
              $scope.items.push({ leftBigText: leftBigText, leftSmallText: '（种类/稻谷）', rightGrayText: rightGrayText, rightBlackText: '当前库存700t', barnId: barnId })
            }
            getManagerInfo($scope.items[0].barnId);
          }, function (error) {
            LoadingService.hide();
            PopupService.setContent("服务器连接失败，请检查您的网络，然后下拉刷新重试");
            PopupService.showAlert();
            $scope.display = "none";
            if ($scope.items.length == 0) {
              $scope.loadFailedText = "数据加载失败";
            }
          });
      };
      var getManagerInfo = function (id) {
        k++;
        $http.get('http://123.56.27.166:8080/barn_application/barn/getUserByBNID?BNID=' + id)
          .then(function (resp) {
            var name, phoneNum;
            if (resp.data.length == 0) {
              name = "";
              phoneNum = "";
            } else {
              name = resp.data[0].name;
              phoneNum = resp.data[0].telephone;
            }
            $scope.persons.push({ name: name, phoneNum: phoneNum });
            if (k < $scope.items.length) {
              getManagerInfo($scope.items[k].barnId);
            } else {
              LoadingService.hide();
            }
          }, function (error) {

          });
      };

      $scope.enter();

      $scope.back = function () {
        $state.go("tabs.home");
      };
      $scope.callPhone = function (phonenumber) {
        $window.location.href = "tel:" + phonenumber;
      };
      $scope.doRefresh = function () {
        $scope.enter();
        $scope.$broadcast('scroll.refreshComplete');
      };
      $scope.loadMore = function () {
        $timeout(function () {
          $scope.noMore = true;
          $scope.loadText = "已没有更多数据";
        }, 1000);
        $scope.$broadcast('scroll.infiniteScrollComplete');
      };

      $scope.viewTemperature = function (text, id) {
        $state.go('tabs.temperature',
          { title: text, id: id });
      }


    }])
  .controller('RiskCtrl', ['$scope',
    function ($scope) {
      $scope.itemClass = ["item", "item", "item"];
      $scope.warn = "img/risk-icon-warn.png";
      $scope.violation = "img/risk-icon-violation.png";
      $scope.statistic = "img/risk-icon-statistic.png";
      $scope.arrow = "img/icon-grey-arrow-right.png";
      $scope.onTouch = function (n) {
        if (n == 0) {
          $scope.warn = "img/risk-icon-warn-light.png";
        }
        if (n == 1) {
          $scope.violation = "img/risk-icon-violation-light.png";
        }
        if (n == 2) {
          $scope.statistic = "img/risk-icon-statistic-light.png";
        }

        for (var i = 0; i < 3; i++) {
          if (i == n) {
            $scope.itemClass[i] = "item green-yellow-bg";
          } else {
            $scope.itemClass[i] = "item";
          }
        }

        $scope.arrow = "img/icon-white-arrow-right.png";
      };
      $scope.onRelease = function (n) {
        if (n == 0) {
          $scope.warn = "img/risk-icon-warn.png";
        }
        if (n == 1) {
          $scope.violation = "img/risk-icon-violation.png";
        }
        if (n == 2) {
          $scope.statistic = "img/risk-icon-statistic.png";
        }

        for (var i = 0; i < 3; i++) {
          $scope.itemClass[i] = "item";
        }

        $scope.arrow = "img/icon-grey-arrow-right.png";
      };
    }])
  .controller('WarnCtrl', ['$scope', '$state', '$http', 'LoadingService', 'PopupService', '$ionicHistory', '$rootScope', 'BarnService',
    function ($scope, $state, $http, LoadingService, PopupService, $ionicHistory, $rootScope, BarnService) {

      if ($ionicHistory.backView().stateName != "tabs.risk") {
        $scope.hide = true;
        $scope.display = "block";
      } else {
        $scope.hide = false;
        $scope.display = "none";
      }
      $scope.$on('$ionicView.beforeEnter', function () {
        $scope.items = [];
        $scope.items = $rootScope.warnItems;
      });
      var barns = BarnService.getBarns();
      var userId = localStorage.getItem("userId");
      var dateTime = "";
      var url = "";
      var lastTime = "";
      $rootScope.warnItems = [];
      $scope.itemClass1 = [];
      $scope.itemClass2 = [];
      $scope.loadFailedText = "";
      $scope.loadMoreShow = 0;
      function formatDate(date) {
        return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
          + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
      }
      $http.get('http://123.56.27.166:8080/barn_application/alarm/getAlarmSumByUID?UID=' + userId, { cache: false })
        .then(function (resp) {
          if (resp.data.length == 0) {
          } else {
            if (resp.data[0].state == 1) {
            } else {
              var news = 0;
              for (i = 0; i < resp.data.length; i++) {
                if (resp.data[i].status == "true") {
                  news++
                }
              }
              $rootScope.badges.news = news;
              if ($rootScope.badges.news > 99) {
                $rootScope.badges.news = "99+"
              }
            }
          }
        }, function (error) {

        });

      $scope.enter = function (state) {
        if (state == 0) {
          LoadingService.show();
          dateTime = formatDate(new Date());
          $rootScope.warnItems = [];
          $scope.items = [];
        } else {
          dateTime = lastTime;
          $scope.loadMoreShow = 1;
        }
        //  url='http://123.56.27.166:8080/barn_application/alarm/getAlarmSumByUID?UID='+userId;
        url = 'http://123.56.27.166:8080/barn_application/alarm/getAlarmSumByUIDLimitTen?UID=' + userId + '&timestamp=' + dateTime;
        $http.get(url, { cache: false })
          .then(function (resp) {
            LoadingService.hide();
            if (resp.data.length == 0) {
              $scope.loadFailedText = "当前数据库中没有任何告警信息"
            } else {
              if (resp.data[0].state == 1) {
                // 因为后台可能会返回空数据，所以要做一个判断，防止程序崩溃
                $scope.loadFailedText = "当前数据库中没有任何告警信息"
              } else {
                $scope.loadFailedText = "";
                var title, detail, date, time, flag, duration, alarmId, confirmId, itemClass1, itemClass2;
                lastTime = resp.data[resp.data.length - 1].create_time;
                for (i = 0; i < resp.data.length; i++) {
                  for (var j = 0; j < barns.length; j++) {
                    if (resp.data[i].BNID == barns[j].barnId) {
                      title = barns[j].barnName;
                    }
                  }

                  detail = title + resp.data[i].alarm_msg;
                  date = resp.data[i].create_time.split(" ")[0];
                  alarmId = resp.data[i].id;
                  confirmId = resp.data[i].confirm_UID;
                  if (resp.data[i].create_time.split(" ")[1].split(":")[0] > 12) {
                    duration = "pm";
                  } else {
                    duration = "am";
                  }
                  time = resp.data[i].create_time.split(" ")[1].split(".")[0] + " " + duration;
                  if (resp.data[i].status == "true") {
                    flag = 0;
                    itemClass1 = "";
                    itemClass2 = "item warn-right-item";
                  } else {
                    flag = 1;
                    itemClass1 = "lightgray-bg";
                    itemClass2 = "item warn-right-item lightgray-bg";
                  }
                  $rootScope.warnItems.push({
                    date: date, time: time, title: title, detail: detail,
                    flag: flag, alarmId: alarmId, confirmId: confirmId,
                    itemClass1: itemClass1, itemClass2: itemClass2
                  });
                }
                $scope.loadMoreShow = 0;
                $scope.items = $rootScope.warnItems;
                /*  $scope.newItems.sort(function(a,b){
                    return a.flag-b.flag});
                  $scope.newItems.sort(function(a,b){
                    return b.time-a.time});
                  for(i=0;i<$scope.newItems.length;i++){
                    if ($scope.newItems[i].flag == 0) {
                      $scope.itemClass1.push("");
                      $scope.itemClass2.push("item warn-right-item");
                    } else {
                      $scope.itemClass1.push("lightgray-bg");
                      $scope.itemClass2.push("item warn-right-item lightgray-bg");
                    }
                  }*/
              }
            }
          }, function (error) {
            LoadingService.hide();
            PopupService.setContent("服务器连接失败，请检查您的网络，然后下拉刷新页面");
            PopupService.showAlert();
            if ($scope.items.length == 0) {
              $scope.loadFailedText = "数据加载失败";
            }

          });
      };


      $scope.enter(0);

      $scope.goConfirm = function (detail, id, i) {
        localStorage.alarmDetail = detail;
        //  localStorage.alarmFlag=flag;
        localStorage.alarmId = id;
        localStorage.receiveType = 0;
        //   localStorage.confirmId=confirmId;
        $state.go("tabs.confirmwarn", { detail: detail, alarmId: id, type: 0, index: i });
      };

      $scope.doRefresh = function () {
        $scope.enter(0);
        $scope.$broadcast('scroll.refreshComplete');
      };
      $scope.loadMore = function () {
        $scope.enter(1);
        $scope.$broadcast('scroll.infiniteScrollComplete');
      };
      $scope.back = function () {
        $state.go("tabs.risk");
      }

    }])
  .controller('WarnConfirmCtrl', ['$scope', '$stateParams', '$http', '$ionicHistory', '$state', 'PopupService', '$rootScope', 'LoadingService', 'UserService',
    function ($scope, $stateParams, $http, $ionicHistory, $state, PopupService, $rootScope, LoadingService, UserService) {

      if ($ionicHistory.backView().stateName != "tabs.warn") {
        $scope.hide = true;
        $scope.display = "block";
        //   document.getElementById("confirmTitle").style.display="block";
        //   $ionicHistory.backView().stateName="tabs.risk"
      } else {
        $scope.hide = false;
        $scope.display = "none";
      }

      $scope.buttonText = "领取预警";
      $scope.buttonClass = "green-bg";
      $scope.confirmPerson = "领取人：";
      $scope.confirmDisplay = "none";
      $scope.alarmType = [];
      var index = $stateParams.index;
      var k = 0;
      var barnId = 0;
      var timestamp = "";
      $scope.warnType = [];
      $scope.more = [];
      $scope.moreIcon = [];
      /*  var type=$stateParams.type;
        $scope.detail = $stateParams.detail;
        $scope.flag = $stateParams.flag;
        $scope.alarmId = $stateParams.alarmId;

        alert($ionicHistory.currentView().stateName);
        var keys="";
        for(key in $ionicHistory.backView()){
            keys=keys+"--"+key;
        }
        alert(keys);
        alert($ionicHistory.backView().stateName);*/
      var type = localStorage.receiveType;
      //  var confirmId=localStorage.confirmId;
      $scope.detail = localStorage.alarmDetail;
      //  $scope.flag = localStorage.alarmFlag;
      $scope.alarmId = localStorage.alarmId;
      //  alert($scope.alarmId);
      /*var enter=function () {
       $http.get('http://123.56.27.166:8080/barn_application/alarm/getAlarmInfoByAlarmId?alarmId='+$scope.alarmId)
         .then(function(resp){
           var flag;
           if(resp.data[0].status=="true"){
             flag=0;
           }else{
             flag=1;
           }
           if(flag==1){
             $scope.buttonText = "已领取";
             $scope.buttonClass = "lightgray-bg";
             document.getElementById("confirm").disabled="disabled";
             getConfirmPerson(resp.data[0].confirm_UID);
           }

         },function(error){
           PopupService.setContent("服务器连接失败，请检查您的网络，然后重试");
           PopupService.showAlert();

         });
     }
      /!*if($scope.flag==1){
          $scope.buttonText = "已领取";
          $scope.buttonClass = "lightgray-bg";
          document.getElementById("confirm").disabled="disabled";

      }*!/
      var getConfirmPerson=function(confirmId){
        if(confirmId!=null){

          $http.get('http://123.56.27.166:8080/barn_application/user/getUserByUID?UID='+confirmId)
            .then(function(resp){
              $scope.confirmPerson=$scope.confirmPerson+resp.data.name;
              $scope.confirmDisplay = "block";
            },function(error){
              /!*PopupService.setContent("服务器连接失败，请检查您的网络，然后重试");
              PopupService.showAlert();*!/

            });
        }
      };*/
      var enter = function () {
        LoadingService.show();
        $http.get('http://123.56.27.166:8080/barn_application/alarm/getAlarmSumByAlarmSumId?alarmSumId=' + $scope.alarmId)
          .then(function (resp) {
            var flag;
            barnId = resp.data[0].BNID;
            timestamp = resp.data[0].create_time;
            if (resp.data[0].status == "true") {
              flag = 0;
            } else {
              flag = 1;
            }
            if (flag == 1) {
              $scope.buttonText = "已领取";
              $scope.buttonClass = "lightgray-bg";
              document.getElementById("confirm").disabled = "disabled";
              getConfirmPerson(resp.data[0].confirm_UID);

            } else {
              LoadingService.hide();
            }
            getWarnDetail(barnId, timestamp);

          }, function (error) {
            PopupService.setContent("服务器连接失败，请检查您的网络，然后重试");
            PopupService.showAlert();

          });
      }
      /*if($scope.flag==1){
       $scope.buttonText = "已领取";
       $scope.buttonClass = "lightgray-bg";
       document.getElementById("confirm").disabled="disabled";

       }*/
      var getConfirmPerson = function (confirmId) {
        if (confirmId != null) {

          $http.get('http://123.56.27.166:8080/barn_application/user/getUserByUID?UID=' + confirmId)
            .then(function (resp) {
              $scope.confirmPerson = $scope.confirmPerson + resp.data.name;
              $scope.confirmDisplay = "block";
              LoadingService.hide();
            }, function (error) {
              /*PopupService.setContent("服务器连接失败，请检查您的网络，然后重试");
               PopupService.showAlert();*/

            });
        }
      };
      var getWarnDetail = function (id, time) {
        $http.get('http://123.56.27.166:8080/barn_application/alarm/getAlarmDetailByBNID?BNID=' + id + '&timestamp=' + time)
          .then(function (resp) {
            var x, y, depth, warnName, temperature;
            $scope.warnType = [];
            k = 0;

            for (var i = 0; i < resp.data.length - 1; i++) {
              x = resp.data[i].location_x;
              y = resp.data[i].location_y;
              depth = resp.data[i].depth;
              temperature = resp.data[i].data;
              warnName = resp.data[i].alarm_type_name;
              if (i == 0) {
                $scope.warnType[k] = new Array();
                $scope.more.push(0);
                $scope.moreIcon.push("icon ion-chevron-right");
                $scope.warnType[k].push({ x: x, y: y, depth: depth, warnName: warnName, temperature: temperature });

              } else {
                if ($scope.warnType[k][0].warnName == warnName) {
                  $scope.warnType[k].push({ x: x, y: y, depth: depth, warnName: warnName, temperature: temperature });
                } else {
                  k++;
                  $scope.warnType[k] = new Array();
                  $scope.more.push(0);
                  $scope.moreIcon.push("icon ion-chevron-right");
                  $scope.warnType[k].push({ x: x, y: y, depth: depth, warnName: warnName, temperature: temperature });
                }
              }
            }
          }, function (error) {

          });
      };
      enter();
      /*$scope.confirm=function(){
          LoadingService.show();
          if(type==0){
              $http.get('http://123.56.27.166:8080/barn_application/alarm/modifyStatusByAlarmId?' +
                  'alarm_id='+$scope.alarmId+'&confirm_UID='+localStorage.userId)
                  .then(function(resp){
                      LoadingService.hide();
                      //   alert(resp);
                      if(resp.data.state==1){
                          // alert("确认成功");
                          PopupService.setContent("领取成功");
                          PopupService.showAlert();
                          $scope.buttonText = "已领取";
                          $scope.buttonClass = "lightgray-bg";
                          $scope.confirmPerson=$scope.confirmPerson+UserService.person.userName;
                          $scope.confirmDisplay = "block";
                          $rootScope.badges.news=$rootScope.badges.news-1;
                      }else{
                          // alert("领取失败");
                        PopupService.setContent("领取失败");
                        PopupService.showAlert();
                      }
                  },function(error){
                      LoadingService.hide();
                      PopupService.setContent("服务器连接失败，请检查您的网络，然后重试");
                      PopupService.showAlert();
                  });
          }else{
              var deviceId=localStorage.warnDeviceId;
              var address=localStorage.warnAddress;
              var alarmType=localStorage.warnAlarmType;
              var unixTimestamp,newtime;
              if(localStorage.warnTime.split('-').length!=1){
                  newtime=localStorage.warnTime;
              }else{
                  var time=parseInt(localStorage.warnTime);
                  unixTimestamp = new Date(time*1000) ;
                  newtime = unixTimestamp.getFullYear()+'-'+(unixTimestamp.getMonth()+1)+'-'+unixTimestamp.getDate()
                      +' '+unixTimestamp.getHours()+':'+unixTimestamp.getMinutes()+':'+unixTimestamp.getSeconds();
              }
              $http.get('http://123.56.27.166:8080/barn_application/alarm/modifyStatusByParas?' +
                  'device_id='+deviceId+'&address='+address+'&time='+newtime+'&alarm_type_id='+alarmType+'&confirm_UID='+localStorage.userId)
                  .then(function(resp){
                    LoadingService.hide();
                      if(resp.data.state==1){
                          // alert("确认成功");
                          PopupService.setContent("确认成功");
                          PopupService.showAlert();
                          $scope.buttonText = "已领取";
                          $scope.buttonClass = "lightgray-bg";
                          $rootScope.badges.news=$rootScope.badges.news-1;
                      }else{
                          // alert("领取失败");
                          PopupService.setContent("领取失败");
                          PopupService.showAlert();
                      }

                  },function(error){

                      PopupService.setContent("服务器连接失败，请检查您的网络，然后重试");
                      PopupService.showAlert();
                  });
          }

      };*/
      $scope.confirm = function () {
        if (UserService.person.userRole == "超级管理员") {
          PopupService.setContent("抱歉，超级管理员无法领取该告警");
          PopupService.showAlert();
        } else {
          LoadingService.show();
          if (type == 0) {
            $http.get('http://123.56.27.166:8080/barn_application/alarm/modifyAlarmSumByAlarmID?' +
              'confirm_UID=' + localStorage.userId + '&alarmSumId=' + $scope.alarmId)
              .then(function (resp) {
                LoadingService.hide();
                //   alert(resp);
                if (resp.data.state == 1) {
                  /* PopupService.setContent("领取成功");
                   PopupService.showAlert();
                   $scope.buttonText = "已领取";
                   $scope.buttonClass = "lightgray-bg";
                   $scope.confirmPerson=$scope.confirmPerson+UserService.person.userName;
                   $scope.confirmDisplay = "block";*/
                  PopupService.setContent("领取成功");
                  $rootScope.warnItems[index].flag = 1;
                  $rootScope.warnItems[index].itemClass1 = "lightgray-bg";
                  $rootScope.warnItems[index].itemClass2 = "item warn-right-item lightgray-bg";
                  var myTap = function () {
                    enter();
                  };
                  PopupService.showPopup(myTap);
                  $rootScope.getNews();
                } else if (resp.data.msg.indexOf("重复") > -1) {
                  PopupService.setContent("有人抢先一步领取了该告警");
                  var myTap = function () {
                    enter();
                  };
                  PopupService.showPopup(myTap);
                } else {
                  PopupService.setContent("领取失败");
                  var myTap = function () {
                    enter();
                  };
                  PopupService.showPopup(myTap);
                }
              }, function (error) {
                LoadingService.hide();
                PopupService.setContent("服务器连接失败，请检查您的网络，然后重试");
                PopupService.showAlert();
              });
          }
          else {
            var deviceId = localStorage.warnDeviceId;
            var address = localStorage.warnAddress;
            var alarmType = localStorage.warnAlarmType;
            var unixTimestamp, newtime;
            if (localStorage.warnTime.split('-').length != 1) {
              newtime = localStorage.warnTime;
            } else {
              var time = parseInt(localStorage.warnTime);
              unixTimestamp = new Date(time * 1000);
              newtime = unixTimestamp.getFullYear() + '-' + (unixTimestamp.getMonth() + 1) + '-' + unixTimestamp.getDate()
                + ' ' + unixTimestamp.getHours() + ':' + unixTimestamp.getMinutes() + ':' + unixTimestamp.getSeconds();
            }
            $http.get('http://123.56.27.166:8080/barn_application/alarm/modifyStatusByParas?' +
              'device_id=' + deviceId + '&address=' + address + '&time=' + newtime + '&alarm_type_id=' + alarmType + '&confirm_UID=' + localStorage.userId)
              .then(function (resp) {
                LoadingService.hide();
                if (resp.data.state == 1) {
                  // alert("确认成功");
                  PopupService.setContent("确认成功");
                  PopupService.showAlert();
                  $scope.buttonText = "已领取";
                  $scope.buttonClass = "lightgray-bg";
                  $rootScope.badges.news = $rootScope.badges.news - 1;
                } else {
                  // alert("领取失败");
                  PopupService.setContent("领取失败");
                  PopupService.showAlert();
                }

              }, function (error) {

                PopupService.setContent("服务器连接失败，请检查您的网络，然后重试");
                PopupService.showAlert();
              });
          }
        }

      };
      $scope.back = function () {
        $state.go("tabs.risk");
        //  $ionicHistory.goBack();
      }
      $scope.showMore = function (flag) {
        var parent = document.getElementById("warn-detail").getElementsByTagName("div")[flag];
        var childSpan1 = parent.getElementsByTagName("span")[0];
        var childSpan2 = parent.getElementsByTagName("span")[1];
        var childI = parent.getElementsByTagName("i")[0];
        if ($scope.moreIcon[flag] == "icon ion-chevron-right") {
          $scope.more[flag] = 1;
          $scope.moreIcon[flag] = "icon ion-chevron-down";
          childSpan1.style.backgroundColor = "#dfb752";
          childI.style.color = "#000000";
          childSpan2.style.color = "#000000";
        } else {
          $scope.more[flag] = 0;
          $scope.moreIcon[flag] = "icon ion-chevron-right";
          childSpan1.style.backgroundColor = "#cdcdcd";
          childI.style.color = "#cdcdcd";
          childSpan2.style.color = "#666666";
        }

      }

    }])
  .controller('PersonCtrl', ['$scope', '$state', '$ionicHistory', 'UserService', 'LoginService',
    function ($scope, $state, $ionicHistory, UserService, LoginService) {
      $scope.version = "当前" + localStorage.appVersion;
      $scope.userName = UserService.person.userName;
      $scope.logout = function () {
        $ionicHistory.clearCache();
        $ionicHistory.clearHistory();
        LoginService.set();
        $state.go("login");
      };
    }])
  .controller('PersonInfoCtrl', ['$scope', 'UserService',
    function ($scope, UserService) {
      $scope.person = UserService.person;
      /* $scope.person.role=UserService.userRole;
       $scope.person.name=UserService.userName;
       $scope.person.sex=UserService.userSex;
       $scope.person.age=UserService.userAge;
       $scope.person.address=UserService.userAddress;*/
    }])
  .controller('PersonAboutCtrl', ['$scope',
    function ($scope) {

      var container = document.getElementById("about-container");
      $scope.version = localStorage.appVersion;
      $scope.copyRight = "Copyright @2016-2018 Tianjin Fuliang Technology Co.,Ltd.";
      $scope.height = (window.screen.height - 100) + "px";
      container.style.height = $scope.height;

    }])

  .controller('StatisticCtrl', ['$scope', '$state', '$http', '$rootScope', function ($scope, $state, $http, $rootScope) {

    //获取数据
    /*$scope.doMessage = function () {


        var url = "http://123.56.27.166:8080/barn_application/alarm/getAlarmInfoByBNID?BNID=1";
        // var url = './templates/police.json';
        $http.get(url).success(function (response) {

            $scope.datas = response;

            var alreadyLength = 0;
            for(i=0;i<response.length;i++){
                if(response[i].status == "true")
                    alreadyLength++;
            }
            var length1 = Math.round(alreadyLength/response.length*10000)/100.00;
            var length2 = 100-length1;
            $scope.message = {already:length1+'%',notyet:length2+'%'};
            console.log('success!!!!!!', response);
        })
        $scope.myvalue = 0.8;
    }*/

    /*$http.get('http://123.56.27.166:8080/barn_application/alarm/getAlarmSumByUID?UID='+localStorage.userId)
      .then(function(resp){
        var already=0,notyet=0;
        for(i=0;i<resp.data.length;i++) {
          if (resp.data[i].status == "true") {
            notyet++;
          } else {
            already++;
          }
        }
        notyet=$rootScope.badges.news;
        already=$rootScope.total-notyet;

        $scope.myvalue=already/(already+notyet);
        already=Math.round(already/(already+notyet)*100);
        notyet=100-already;
        $scope.message = {already:already+'%',notyet:notyet+'%'};
        doCanvas();

      },function(error){

      });*/
    var doCanvas = function () {
      //获取Canvas对象(画布)
      var canvas = document.getElementById("myCanvas");
      //简单地检测当前浏览器是否支持Canvas对象，以免在一些不支持html5的浏览器中提示语法错误
      if (canvas.getContext) {
        //获取对应的CanvasRenderingContext2D对象(画笔)
        var context = canvas.getContext("2d");
        var centerSize = [60, 60, 50];
        //画红色的圆
        context.beginPath();
        context.moveTo(centerSize[0], centerSize[1]);
        context.arc(centerSize[0], centerSize[1], centerSize[2], 0, Math.PI * 2, false);
        context.closePath();
        context.fillStyle = '#E93458';
        context.fill();
        //灰色的
        context.beginPath();
        context.moveTo(centerSize[0], centerSize[1]);
        context.arc(centerSize[0], centerSize[1], centerSize[2], 0, Math.PI * 2 * $scope.myvalue, false);
        context.closePath();
        context.fillStyle = '#F099B8';
        context.fill();

        //画里面的白色的圆
        context.beginPath();
        context.moveTo(centerSize[0], centerSize[1]);
        context.arc(centerSize[0], centerSize[1], centerSize[2] - 15, 0, Math.PI * 2, true);
        context.closePath();
        context.fillStyle = 'rgba(255,255,255,1)';
        context.fill();
      }

      //获取Canvas对象(画布)
      var canvas2 = document.getElementById("myCanvas2");
      //简单地检测当前浏览器是否支持Canvas对象，以免在一些不支持html5的浏览器中提示语法错误
      if (canvas2.getContext) {
        //获取对应的CanvasRenderingContext2D对象(画笔)
        var context = canvas2.getContext("2d");
        var value = canvas2.getAttribute("value");
        var centerSize = [60, 60, 50];
        //灰色的
        context.beginPath();
        context.moveTo(centerSize[0], centerSize[1]);
        context.arc(centerSize[0], centerSize[1], centerSize[2], 0, Math.PI * 2, false);
        context.closePath();
        context.fillStyle = '#4DAED5';
        context.fill();
        //画红色的圆
        context.beginPath();
        context.moveTo(centerSize[0], centerSize[1]);
        context.arc(centerSize[0], centerSize[1], centerSize[2], 0, Math.PI * 2 * value, false);
        context.closePath();
        context.fillStyle = '#99E2FC';
        context.fill();
        //画里面的白色的圆
        context.beginPath();
        context.moveTo(centerSize[0], centerSize[1]);
        context.arc(centerSize[0], centerSize[1], centerSize[2] - 15, 0, Math.PI * 2, true);
        context.closePath();
        context.fillStyle = 'rgba(255,255,255,1)';
        context.fill();
      }
    };
    var notyet = $rootScope.myNews;
    var already = $rootScope.total - notyet;

    $scope.myvalue = already / (already + notyet);
    already = Math.round(already / (already + notyet) * 100);
    notyet = 100 - already;
    $scope.message = { already: already + '%', notyet: notyet + '%' };
    doCanvas();

  }])
  .controller('UpdateCtrl', ['$scope', '$http', 'PopupService', '$cordovaNetwork',
    function ($scope, $http, PopupService, $cordovaNetwork) {

      $scope.display = "none";
      $scope.versionText = "检测到最新版本为: ";

      $http.get('http://123.56.27.166:8080/barn_application/version/getLatestVersion')
        .then(function (resp) {
          var nowVersion = resp.data[0].version_id;
          if (nowVersion != localStorage.appVersion) {
            $scope.versionText = $scope.versionText + nowVersion;
            $scope.display = "block";
          } else {
            $scope.versionText = "当前版本已为最新";
            $scope.display = "none";
          }

        }, function (error) {
          PopupService.setContent("网络连接错误");
          PopupService.showAlert();

        });

      $scope.update = function () {
        var type = $cordovaNetwork.getNetwork();
        var continueLoad = function () {
          window.open('https://fir.im/barn1', '_system');
        };
        if (type != Connection.WIFI) {
          PopupService.setContent("检测到您的手机处于非wifi网络环境，是否继续更新？");
          PopupService.showYNPopup(continueLoad);
        } else {
          continueLoad();
        }
      }

    }])
  .controller('TestCtrl', ['$scope', '$cordovaDatePicker',
    function ($scope, $cordovaDatePicker) {

      var options1 = {
        date: new Date(),
        mode: 'date',
        titleText: '请选择系统日期',
        androidTheme: window.datePicker.ANDROID_THEMES.THEME_HOLO_LIGHT
      };
      var options2 = {
        date: new Date(),
        mode: 'time',
        titleText: '请选择系统时间',
        is24Hour: true,
        androidTheme: window.datePicker.ANDROID_THEMES.THEME_HOLO_LIGHT
      };
      $scope.pickDate = function () {

        $cordovaDatePicker.show(options1).then(function (date1) {
          $cordovaDatePicker.show(options2).then(function (date2) {
          });
        });
      }

    }])
  .controller('LineCtrl', ['$scope', '$ionicPopover', '$cordovaDatePicker', 'PopupService', '$http', 'BarnService',
    function ($scope, $ionicPopover, $cordovaDatePicker, PopupService, $http, BarnService) {

      $scope.barns = [];
      $scope.charts = ["层均温", "三温"];
      $scope.startTime = "请选择";
      $scope.endTime = "请选择";
      $scope.chart = $scope.charts[0];
      var oneDay = 1000 * 3600 * 24;
      $scope.date = (new Date()).getTime() - 10 * oneDay;
      var myData = [];
      var xData = [];
      var option = {};
      var lineChart = echarts.init(document.getElementById("lineChart"));
      var date1 = 0;
      var date2 = 0;
      var threeColors = ['#FC022D', '#D2CD00', '#036697'];
      var levelColors = ['#ED0909', '#E1861B', '#7FB90F', '#298CBE', '#C77EB5'];
      var dateTime = "";
      $scope.yLabel = "层均温";
      $scope.chartTitle = $scope.chart + '变化图';
      var maxLevels = ['一层', '二层', '三层', '四层', '五层', '六层'];
      var levels = [];
      var series = [];
      var barnId = 1;
      var symbolShow = false;
      var fromTimestamp = "2017-6-6" + " " + "16:41:42";
      var toTimestamp = "2017-6-13" + " " + "10:41:42";
      var oneSeries = {};

      $scope.barnPopover = $ionicPopover.fromTemplateUrl('barn-popover.html', {
        scope: $scope
      });
      // .fromTemplateUrl() 方法
      $ionicPopover.fromTemplateUrl('barn-popover.html', {
        scope: $scope
      }).then(function (popover) {
        $scope.barnPopover = popover;
      });
      $scope.openBarnPopover = function ($event) {
        $scope.barnPopover.show($event);
      };
      $scope.closeBarnPopover = function () {
        $scope.barnPopover.hide();
      };

      $scope.selectBarn = function (i) {
        $scope.closeBarnPopover();
        $scope.barn = $scope.barns[i].barnName;
        barnId = $scope.barns[i].barnId;
      };

      $scope.chartPopover = $ionicPopover.fromTemplateUrl('chart-popover.html', {
        scope: $scope
      });
      $ionicPopover.fromTemplateUrl('chart-popover.html', {
        scope: $scope
      }).then(function (popover) {
        $scope.chartPopover = popover;
      });
      $scope.openChartPopover = function ($event) {
        $scope.chartPopover.show($event);
      };
      $scope.closeChartPopover = function () {
        $scope.chartPopover.hide();
      };

      $scope.selectChart = function (i) {
        $scope.closeChartPopover();
        $scope.chart = $scope.charts[i];
        $scope.yLabel = $scope.chart;
        $scope.chartTitle = $scope.chart + '变化图';
      };

      var getBarns = function () {
        $scope.barns = BarnService.getBarns();
        $scope.barn = BarnService.getBarns()[0].barnName;
        barnId = BarnService.getBarns()[0].barnId;
      };

      getBarns();

      $scope.selectComplete = function () {
        if (date1 == "") {
          PopupService.setContent("请选择起始日期");
          PopupService.showAlert();
        } else if (date2 == "") {
          PopupService.setContent("请选择终止日期");
          PopupService.showAlert();
        } else {
          lineChart.clear();
          if ($scope.chart == '层均温') {
            getLevelAverageData();
          } else {
            getBarnTemperatureData();
          }
        }
        /*lineChart.clear();
        if($scope.chart=='层均温'){
          getLevelAverageData();
        }else{
          getBarnTemperatureData();
        }*/

      };

      function formatDate(date) {
        return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
      }
      var options1 = {
        date: new Date(new Date() - oneDay),
        mode: 'date', // or 'time'
        minDate: new Date(2017, 5, 6).getTime(),
        maxDate: new Date() - oneDay,
        titleText: '起始日期',
        androidTheme: window.datePicker.ANDROID_THEMES.THEME_HOLO_LIGHT
      };
      var options2 = {};
      $scope.selectTime1 = function () {
        $cordovaDatePicker.show(options1).then(function (date) {
          dateTime = formatDate(date);
          //  alert(formatDate(new Date(date.getTime())));
          $scope.startTime = dateTime;
          $scope.date = date.getTime();
          date1 = date.getTime();
          var interval = 10;
          if ((date1 + oneDay * 10) > (new Date()).getTime()) {
            interval = ((new Date()).getTime() - date1) / oneDay;
          }
          document.getElementById("end").style.disabled = "";
          document.getElementById("end").style.color = "#108678";
          document.getElementById("end").className = "select";
          document.getElementById("end").getElementsByTagName('input')[0].style.color = "#000000";
          options2 = {
            date: new Date(),
            mode: 'date', // or 'time'
            titleText: '终止日期',
            minDate: date1 + oneDay,
            maxDate: date1 + oneDay * interval,
            androidTheme: window.datePicker.ANDROID_THEMES.THEME_HOLO_LIGHT
          };
        });
      };

      $scope.selectTime2 = function () {
        $cordovaDatePicker.show(options2).then(function (date) {
          dateTime = formatDate(date);
          $scope.endTime = dateTime;
          date2 = date.getTime();
        });
      };

      setMyOption();
      lineChart.setOption(option, true);

      function getLevelAverageData() {
        myData = [];
        xData = [];
        levels = [];
        series = [];
        lineChart.showLoading();
        fromTimestamp = $scope.startTime + " " + "16:41:42";
        toTimestamp = $scope.endTime + " " + "16:41:42";
        $http.get('http://123.56.27.166:8080/barn_application/node/getGrainAverageByTimeRange?BNID=' + barnId + '&fromTimestamp=' + fromTimestamp + '&toTimestamp=' + toTimestamp)
          .then(function (resp) {
            for (var j = 0; j < resp.data[0].list.length; j++) {
              levels.push(maxLevels[j]);
              myData[j] = new Array();
            }
            for (var i = 0; i < resp.data.length; i++) {
              /*var dateTime=resp.data[i].timestamp.split(" ");
              var time="";
              if(dateTime.length>1){
                time=dateTime[1].split(":")[0]+":"+dateTime[1].split(":")[1];
              }
              xData.push(dateTime[0]+"\n"+time);*/
              xData.push(resp.data[i].timestamp);
              for (j = 0; j < resp.data[i].list.length; j++) {
                var levelAverage = resp.data[i].list[j].levelAverage.toFixed(2);
                myData[j].push(levelAverage);
              }

            }
            /*category=xData.map(function (str) {
              return str.replace('2017-', '').replace('-','/');
            });*/
            for (i = 0; i < myData.length; i++) {
              var data = [];
              for (j = 0; j < myData[i].length; j++) {
                data[j] = new Array();
                data[j].push(xData[j]);
                data[j].push(myData[i][j]);
              }
              var oneSeries = {
                name: levels[i],
                type: 'line',
                lineStyle: {
                  normal: {
                    width: 3
                  }
                },
                smooth: true,
                symbol: 'circle',
                itemStyle: {
                  normal: {
                    // 设置线条的颜色
                    color: levelColors[i]
                  }
                },
                data: data,
                showSymbol: symbolShow
              };
              series.push(oneSeries);
            }

            lineChart.hideLoading();

            /* for(i=0;i<myData.length;i++){
               var oneSeries= {
                 name:levels[i],
                 type:'line',
                 smooth: true,
                 itemStyle: {
                   normal: {
                     // 设置线条的颜色
                     color: colors[i]
                   }
                 },
                 data:myData[i]
               };
               series.push(oneSeries);
             }*/

            setMyOption();
            lineChart.setOption(option, true);
          }, function (error) {

          });
        /* for(var i=0;i<length;i++){
           var dataY=Math.round(Math.random() * 10);
           var dataX=i*oneDay;
           data1.push(dataY+25);
           data2.push(dataY+22);
           data3.push(dataY+19);
           data4.push(dataY+16);
           data5.push(dataY+27);
           xData.push(formatDate(new Date(Math.round($scope.date+dataX))));
         }*/
      }

      function getBarnTemperatureData() {
        series = [];
        levels = ['仓温', '气温', '粮温'];
        lineChart.showLoading();
        fromTimestamp = $scope.startTime + " " + "16:41:42";
        toTimestamp = $scope.endTime + " " + "16:41:42";
        $http.get('http://123.56.27.166:8080/barn_application/node/getBarnTemperatureByTimeRange?BNID=' + barnId + '&fromTimestamp=' + fromTimestamp + '&toTimestamp=' + toTimestamp)
          .then(function (resp) {
            var data1 = [];
            for (var i = 0; i < resp.data.length; i++) {
              /*myData.push(resp.data[i].data.toFixed(2));
              xData.push(resp.data[i].timestamp);*/
              data1[i] = new Array();
              data1[i].push(resp.data[i].timestamp);
              data1[i].push(resp.data[i].data.toFixed(2));
            }
            oneSeries = {
              name: levels[0],
              type: 'line',
              lineStyle: {
                normal: {
                  width: 3
                }
              },
              smooth: true,
              symbol: 'circle',
              showSymbol: symbolShow,
              itemStyle: {
                normal: {
                  // 设置线条的颜色
                  color: threeColors[0]
                }
              },
              data: data1
            };
            series.push(oneSeries);

            getTemperatureData();
          }, function (error) {

          });
      }

      function getTemperatureData() {
        $http.get('http://123.56.27.166:8080/barn_application/node/getTemperatureByTimeRange?BNID=' + barnId + '&fromTimestamp=' + fromTimestamp + '&toTimestamp=' + toTimestamp)
          .then(function (resp) {
            var data2 = [];
            for (var i = 0; i < resp.data.length; i++) {
              data2[i] = new Array();
              data2[i].push(resp.data[i].timestamp);
              data2[i].push(resp.data[i].data.toFixed(2));
            }
            oneSeries = {
              name: levels[1],
              type: 'line',
              lineStyle: {
                normal: {
                  width: 3
                }
              },
              smooth: true,
              symbol: 'circle',
              showSymbol: symbolShow,
              itemStyle: {
                normal: {
                  // 设置线条的颜色
                  color: threeColors[1]
                }
              },
              data: data2
            };
            series.push(oneSeries);

            getGrainTemperatureData();
          }, function (error) {

          });
      }

      function getGrainTemperatureData() {
        $http.get('http://123.56.27.166:8080/barn_application/node/getGrainAverageByTimeRange?BNID=' + barnId + '&fromTimestamp=' + fromTimestamp + '&toTimestamp=' + toTimestamp)
          .then(function (resp) {
            /*for(var i=0;i<resp.data.length;i++){
              var dateTime=resp.data[i].timestamp.split(" ");
              var time="";
              if(dateTime.length>1){
                time=dateTime[1].split(":")[0]+":"+dateTime[1].split(":")[1];
              }
              xData.push(dateTime[0]+"\n"+time);
              myData.push(resp.data[i].barnAverage.toFixed(2));
            }
            category=xData.map(function (str) {
              return str.replace('2017-', '').replace('-','/');
            });*/
            var data3 = [];
            for (var i = 0; i < resp.data.length; i++) {
              data3[i] = new Array();
              data3[i].push(resp.data[i].timestamp);
              data3[i].push(resp.data[i].barnAverage.toFixed(2));
            }
            oneSeries = {
              name: levels[2],
              type: 'line',
              lineStyle: {
                normal: {
                  width: 3
                }
              },
              smooth: true,
              symbol: 'circle',
              showSymbol: symbolShow,
              itemStyle: {
                normal: {
                  // 设置线条的颜色
                  color: threeColors[2]
                }
              },
              data: data3
            };
            series.push(oneSeries);
            lineChart.hideLoading();

            setMyOption();
            lineChart.setOption(option, true);
          }, function (error) {

          });
      }

      // 指定图表的配置项和数据
      function setMyOption() {
        option = {
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              animation: false
            }
          },
          legend: {
            right: 20,
            bottom: 20,
            data: levels
          },
          grid: {
            left: 30,
            top: 20,
            height: '65%',
            containLabel: true
          },
          /* xAxis: {
             type: 'category',
             name:'时间',
             nameLocation:'middle',
             nameGap:40,
             boundaryGap: false,
             data:category
           },
           yAxis: {
             type: 'value',
             name: yLabel,
             nameLocation:'middle',
             nameGap:30,
             splitLine:{
               lineStyle:{
                 color:'#aaa'
               }
             }
           },*/
          xAxis: {
            type: 'time',
            name: '时间',
            splitLine: {
              show: false
            },
            nameLocation: 'middle',
            nameGap: 45
          },
          yAxis: {
            type: 'value',
            boundaryGap: ['0', '100%'],
            name: $scope.yLabel,
            nameLocation: 'middle',
            nameGap: 40,
            splitLine: {
              lineStyle: {
                color: '#aaa'
              }
            }
          },
          dataZoom: [
            {
              type: 'inside',
              xAxisIndex: [0]
            }
          ],
          series: series
        };
      }


    }])
