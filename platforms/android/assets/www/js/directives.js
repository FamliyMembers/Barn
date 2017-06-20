/**
 * Created by Administrator on 2017/5/8.
 */
angular.module('directives', [])
    .directive('tableListItem',['$state',function($state){
        return{

            templateUrl: 'components/table-list-item.html',
            restrict: 'AE',
            scope:{
                itemText: '@',
                iconLeft: '@',
                iconRight: '@',
                iconRightShow:'@',
                badgeText: '@',
                badgeShow: '@',
                extraText: '@',
                textShow: '@'
            },
            link: function($scope,$element,$attrs){
                $scope.badgeShow=0;
                $scope.textShow=0;
                $scope.iconRight="img/icon-grey-arrow-right.png";
                $scope.iconRightShow=1;
            }
        };
    }])
    .directive('violationListItem',[function(){
        return{

            templateUrl: 'components/violation-list-item.html',
            restrict: 'AE',
            scope:{
                topText: '@',
                badgeText: '@',
                badgeShow: '@',
                badgeState: '@',
                badgeStyle: '@',
                bottomText: '@'
            },
            link: function($scope,$element,$attrs){
                $scope.badgeShow=false;
                $scope.badgeStyle="violation-badge-style rosered-bg";
                if($scope.badgeState==1){
                    $scope.badgeStyle="violation-badge-style deepgray-bg";
                    $scope.badgeText="解";
                }else{
                    $scope.badgeStyle="violation-badge-style rosered-bg";
                    $scope.badgeText="未";
                }
            }
        };
    }])
    .directive('detailListItem',[function(){
        return{

            templateUrl: 'components/depository-detail-list-item.html',
            restrict: 'AE',
            scope:{
                iconLeft: '@',
                leftBigText: '@',
                leftSmallText: '@',
                iconRight: '@',
                rightGrayText: '@',
                rightBlackText: '@',
                name:'@',
                phoneNum:'@'
            },
            link: function($scope,$element,$attrs){
               if($scope.leftSmallText.indexOf('稻')>-1){
                   $scope.iconLeft="img/personinfo-icon-name.png";
               }else if($scope.leftSmallText.indexOf('麦')>-1){
                    $scope.iconLeft="img/personinfo-icon-sex.png";
                }else if($scope.leftSmallText.indexOf('豆')>-1){
                   $scope.iconLeft="img/personinfo-icon-address.png";
               }else{
                 $scope.iconLeft="img/personinfo-icon-name.png";
               }

              $scope.myCall=function () {
                window.location.href="tel:"+$scope.phoneNum;
              }

            }
        };
    }])
