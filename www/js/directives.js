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
                badgeText: '@',
                badgeShow: '@',
                extraText: '@',
                textShow: '@'
            },
            link: function($scope,$element,$attrs){
                $scope.badgeShow=false;
                $scope.textShow=false;
                $scope.iconRight="img/icon-grey-arrow-right.png";
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
                rightBlackText: '@'
            },
            link: function($scope,$element,$attrs){
               if($scope.leftSmallText=="（种类/稻谷）"){
                   $scope.iconLeft="img/personinfo-icon-name.png";
               }else if($scope.leftSmallText=="（种类/小麦）"){
                    $scope.iconLeft="img/personinfo-icon-sex.png";
                }else if($scope.leftSmallText=="（种类/大豆）"){
                   $scope.iconLeft="img/personinfo-icon-address.png";
               }
              $scope.myCall=function (phoneNum) {
                $window.location.href="tel:"+phoneNum;
              }

            }
        };
    }])
