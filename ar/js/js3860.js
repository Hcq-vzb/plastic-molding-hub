$(document).ready(function () {
    $(document).bind("contextmenu", function (e) {
        return false;
    });
});
$(function () {
    $(".kl_left .list li.cur>a").click(function () {
        event.preventDefault();
        $(this).parents(".kl_left .list li.cur").find(".sub_1j").stop(0, 1).slideToggle();
    })
    $(".kl_left .list li.open>a").click(function () {
        event.preventDefault();
        $(this).parents(".kl_left .list li.open").find(".sub_1j").stop(0, 1).slideToggle();
    })
    $(".kl_left .list li .sub a.cur").click(function () {
        event.preventDefault();
        _this = $(this)
        if (_this.siblings(".sub_2").hasClass("curs")) {
            _this.siblings(".sub_2").stop(0, 1).slideToggle(400, function () {
                _this.siblings(".sub_2").removeClass("curs")
            });
            $(this).addClass("curss")
        }
        else {
            _this.siblings(".sub_2").stop(0, 1).slideToggle(400, function () {
                _this.siblings(".sub_2").addClass("curs")
            });
            $(this).removeClass("curss")
        }
    })
	$(".kl_left .list li").each(function(i,e){
		if($(".kl_left .list li").eq(i).find(".diyizhong a").length<=0)
		{
			$(".kl_left .list li").eq(i).find(".diyizhong").hide();
			$(".kl_left .list li").eq(i).find(".dierzhong").show();
		}
	})
	$(".kl_left .list li .sub a").click(function(){
		$(this).addClass("cur")
	})
	$(".guanbi").click(function(){
		$(".banner_news").hide();
	})
	$("body").on("click",".ad_l3 a",function(e){
		console.log(e)
		//e.stopPropagation();
		_href=$(this).attr("href");
		$(".about_content .main_w").load(_href+' .sjnr',function(){
			$(".fancybox").fancybox({centerOnScroll:true,changeSpeed:0,scrolling:'no',showNavArrows:true});
			dataAnimate();
		});
		return false;
	})
    $(window).scroll(function () {
        if ($(window).scrollTop() > 0) {
            $(".main_tops").addClass("main_tops_piao")
        }
        else {
            $(".main_tops").removeClass("main_tops_piao")
        }
    })
    $(window).load(function () {
        if ($(window).scrollTop() > 0) {
            $(".main_tops").addClass("main_tops_piao")
        }
        else {
            $(".main_tops").removeClass("main_tops_piao")
        }
    })
	$(".a_b_products_4 li").each(function(i,e){
		var str1;
		if(i<9){str1="0"+(i+1)}else{str1=(i+1)}
		$(this).attr("data-index",str1)
	})
	$(".a_b_products_1_left li a").click(function(){
		$(".a_b_products_1_left p").html($(this).html())
		$(".a_b_products_1_left ul").slideUp();
		$("#fl").val($(this).attr("id"));
	})
	if($("#fl").val()>0)
	{
		$("#"+$("#fl").val()).trigger("click");
	}
	if($("#PageContent").html()==""){$("#PageContent").hide();}
	$(".claksi_top_left_2 #submit").click(function() {
		var txt_1 = $("#txt_name");
		if ($.trim(txt_1.val()) == "") {
			layer.tips('Please enter name!', '#txt_name', {time:2000,tips:[3,"#008cd6"]})
			txt_1.focus();
			return false;
		}
		var txt_3 = $("#txt_tel");
		if ($.trim(txt_3.val()) == "") {
			layer.tips('Please enter phone!', '#txt_tel', {time:2000,tips:[3,"#008cd6"]})
			txt_3.focus();
			return false;
		}
		var txt_6 = $("#txt_title");
		if ($.trim(txt_6.val()) == "") {
			layer.tips('Please enter address!', '#txt_title', {time:2000,tips:[3,"#008cd6"]})
			txt_6.focus();
			return false;
		}
		// else if (!cshi.cellPhone(txt_3.val())) {
		// 	alert("联系方式格式错误");
		// 	txt_3.focus();
		// 	return false;
		// }
		var txt_4 = $("#txt_content");
		if ($.trim(txt_4.val()) == "") {
			layer.tips('Please enter content!', '#txt_content', {time:2000,tips:[3,"#008cd6"]})
			txt_4.focus();
			return false;
		}
		return true;
	})
	
	var cshi = {
		isTel: function (s) {
			var patrn = /^0\d{2,3}-?\d{7,8}$/
			if (!patrn.test(s)) return false
			return true
		},
		isMobile: function (value) {
			var validateReg = /^((\+?86)|(\(\+86\)))?1\d{10}$/;
			return validateReg.test(value);
		},
		cellPhone: function (value) {
			var cellPhoneNumber = value;
			if (Validate.isMobile(cellPhoneNumber) || Validate.isTel(cellPhoneNumber)) {
				return true;
			} else {
				return false;
			}
		},
		telePhone: function () {
		}
	}


	$(".top_search").click(function(){
		$(".tjio").show();
	})
	$(".tjio").click(function(){
		$(".tjio").hide();
	})
	$(".searchs").click(function(e){
		e.stopPropagation();
	})
	
	$(".a_b_products_1_right-2 input").click(function(){
		if($(".a_b_products_1_right-1 input").val()==""){
			layer.tips('Please enter keywords!', '.a_b_products_1_right-1 input', {time:2000,tips:[3,"#008cd6"]})
			return false;
		}
		if($(this).attr("id")=="solution"){
			location.href='/en/search2/?cid='+$("#fl").val()+'&keys='+$(".a_b_products_1_right-1 input").val();
			return;}
		location.href='/en/search/?cid='+$("#fl").val()+'&keys='+$(".a_b_products_1_right-1 input").val();
	})

	$(".seay input").click(function(){
		if($(".seaz input").val()==""){
			layer.tips('Please enter content!', '.seaz input', {time:2000,tips:[3,"#008cd6"]})
			return false;
		}
	})
	
	setTimeout(()=>{dataAnimate();},1000)
	$(".menu_wap").click(function () {
        if ($(this).find("i").attr("class") == "on") {
            $(this).find("i").removeClass();
            $(".in_topbox .menu").slideUp();
        } else {
            $(this).find("i").addClass("on");
            $(".in_topbox .menu").slideDown();
        }
    });
	
	$(".close").click(function(){
		$(".menu_wap").trigger("click");
		})
	//头部导航
	$(".in_topbox .menu li").click(function(){
		if($(this).find("div").css("display")=="none"){
			$(this).find("div").slideDown();
		}
		else{
			$(this).find("div").slideUp();
		}
	});
	
	$(".qysm_xia li").click(function(){
		let a1=$(".qysm_xia li").index($(this))
		$(".qysm_shang li").removeClass("cur").eq(a1).addClass("cur");
		$(".qysm_xia li").removeClass("cur").eq(a1).addClass("cur");
	})
	$(".a_b_products_1_left p").click(function(){
		$(this).siblings("ul").slideToggle()
	})
	$(".products_list_title_series p").click(function(){
		$(this).siblings("ul").slideToggle()
		$(this).parent().siblings(".products_list_title_series").find("ul").hide();
	})
	$(".dao_content_2_menu li").click(function(){
		const a_1=$(".dao_content_2_menu li").index($(this))
		$(".dao_content_2_menu li").removeClass("cur").eq(a_1).addClass("cur");
		$(".dao_content_3_content").removeClass("cur").eq(a_1).addClass("cur");
	})
	$(".dao_content_right_list li").click(function(){
		const a_2=$(".dao_content_right_list li").index($(this))
		$(".dao_content_right_list li").removeClass("cur").eq(a_2).addClass("cur");
		$(".dao_content_left img").attr("src",$(this).attr("attr-img"))
	})

	// //产品栏目下拉
	$(".kl_left.pro_show .list>ul>li").click(function(){
		var li = $(this);
		//$(".kl_left.pro_show .list>ul>li").removeClass("in open").eq($(".kl_left.pro_show .list>ul>li").index(li)).addClass("in open");
	})
	//$(".kl_left.pro_show  .diyizhong>.sub>.item").click(function(){
	//	var l1=$(".kl_left.pro_show  .diyizhong>.sub>.item").index($(this))
	//	$(".kl_left.pro_show  .diyizhong>.sub>.item>a").removeClass("cur")
	//	$(".kl_left.pro_show  .diyizhong>.sub>.item .sub_2").removeClass("curs")
	//	$(".kl_left.pro_show  .diyizhong>.sub>.item").eq(l1).find(">a").addClass("cur")
	//	$(".kl_left.pro_show  .diyizhong>.sub>.item").eq(l1).find(".sub_2").addClass("curs")
	//})
	// $(".kl_left.pro_show .list>ul>li").hover(function(){
	// 	var li = $(this);
	// 	if(li.hasClass("open")){
	// 		li.removeClass("open");
	// 	}else{
	// 		li.addClass("open").siblings("li").removeClass("open");
	// 	}
	// },function(){
	// 	var li = $(this)
	// 	li.removeClass("open").siblings().removeClass("open");

	// })

	//招聘
	$(".cbgb>ul").on("click",">li",function(){
		if(!$(this).hasClass("on")){
					$(".cbgb li").removeClass("on");
					$(this).addClass("on")
					$(".cbga").slideUp();
					$(".cbgd").slideDown();
					$(this).find(".cbgd").slideUp();
					$(this).find(".cbgd").siblings(".cbga").slideDown();}
		})
	if($(".cbgb li").length>0){
		$(".cbgb li").eq(0).trigger("click");
		}
		$(".cplb li").click(function(){
			$(".cplb li").removeClass("cur");
			$(this).addClass("cur");
			$(".jgsb").hide();
			$(".jgsb").eq($(this).index()).show();
		})

	
})
$(window).load(function () {
    setTimeout(function () { $(".guanbi").trigger("click")},15000)
	let so1=[]
	$(".cdan_s2").each(function(i,e){
		so1[i]=new Swiper($(e),{
			slidesPerView : 1,
			navigation: {
				//nextEl: ".arrow_2_right",
				//prevEl: ".arrow_2_left",
			},
			lazy: true,
			pagination: {
				//el:$(e).find(".cdan_s-pagination"),
				clickable:true,
			},
			effect:'fade',
			fadeEffect:{
				crossFade:true,
			},
			on: {
				
			},
			autoplay: false,
			loop: false
		})
	})
	// $(".cdan_s").each(function(i,e){
	// 	var ks=2;
	// 	if($(e).find("li").length<2 || $(window).width()<1280){ks=1}
	// 	new Swiper($(e),{
	// 		slidesPerView : ks,
	// 		navigation: {
	// 			nextEl: $(e).siblings(".cdan_s_2_content3").find(".cdan_s_2_content3_right"),
	// 			prevEl: $(e).siblings(".cdan_s_2_content3").find(".cdan_s_2_content3_left"),
	// 		},
	// 		spaceBetween: 30,
	// 		lazy: true,
	// 		pagination: {
	// 			el:$(e).find(".cdan_s-pagination"),
	// 			clickable:true,
	// 		},
	// 		// effect:'fade',
	// 		// fadeEffect:{
	// 		// 	crossFade:true,
	// 		// },
	// 		noSwiping:false,
	// 		on: {
	// 			slideChangeTransitionStart: function(){
	// 				//so1[i].slideTo(this.activeIndex)
	// 			}
	// 		},
	// 		autoplay: false,
	// 		loop: false
	// 	})
	// })
	$(".cfeng_swiper").each(function(i,e){
		//var ks=2;
		//if($(e).find("li").length<2 || $(window).width()<1280){ks=1}
		new Swiper($(e),{
			slidesPerView : 4,
			navigation: {
				//nextEl: $(e).siblings(".cdan_s_2_content3").find(".cdan_s_2_content3_right"),
				//prevEl: $(e).siblings(".cdan_s_2_content3").find(".cdan_s_2_content3_left"),
			},
			spaceBetween: 30,
			lazy: true,
			pagination: {
				//el:$(e).find(".cfeng_swiper-pagination"),
				clickable:true,
			},
			// effect:'fade',
			// fadeEffect:{
			// 	crossFade:true,
			// },
			noSwiping:false,
			on: {
				slideChangeTransitionStart: function(){
					//so1[i].slideTo(this.activeIndex)
				}
			},
			breakpoints: { 
				//当宽度大于等于320
				320: {
				  slidesPerView: 1,
				  spaceBetween: 0
				},
			   //当宽度大于等于480
				480: { 
				  slidesPerView: 2,
				  spaceBetween: 10
				},
				//当宽度大于等于640
				640: {
				  slidesPerView: 3,
				  spaceBetween: 20
				},
				//当宽度大于等于640
				1440: {
				  slidesPerView: 4,
				  spaceBetween: 30
				}
			  },			
			autoplay: false,
			loop: false
		})
	})
	



	dataAnimate();
if($(".fancybox").length>0){$(".fancybox").fancybox({centerOnScroll:true,changeSpeed:0,scrolling:'no',showNavArrows:true});}
if($(".fancybox2").length>0){$(".fancybox2").fancybox({centerOnScroll:true,changeSpeed:0,scrolling:'no',showNavArrows:true});}
if($(".fancybox3").length>0){$(".fancybox3").fancybox({centerOnScroll:true,changeSpeed:0,scrolling:'no',showNavArrows:true});}
	if($(".shzr_content").length>0){
		let _initialSlides=0
		if($(".shzr_content li").length>1){_initialSlides=1}
		var banner_7 = new Swiper('.shzr_content',{
			initialSlide:_initialSlides,
			//centeredSlides: true,
			navigation: {
				nextEl: ".shzr_ar_right",
				prevEl: ".shzr_ar_left",
			},
			slidesPerView: 4,
			spaceBetween: "2.083333%",
			breakpoints: {
				1360: {
					slidesPerView: 4,
					},
				 1024: {
					slidesPerView: 4,
					},
				999: {
					   slidesPerView: 2,
					   },
				320: {
					slidesPerView: 1,
					},
				0: {
					slidesPerView: 1,
					},
			},
			lazy: true,
			pagination: {
				//el:".m_banner-pagination",
				clickable:true,
			},
			on: {
				slideChangeTransitionEnd: function(){
					if($(window).width()>=768){
					  $(".shzr_content li").removeClass("black").eq(this.activeIndex-1).addClass("black");
				  $(".shzr_content li").eq(this.activeIndex+4).addClass("black");
					  }
		  },
			},
			autoplay: false,
			loop: false
		})
	}

	if($(".ryzj_content").length>0){
		var banner_6 = new Swiper('.ryzj_content',{
			slidesPerView : 6,
			//centeredSlides: true,
			navigation: {
				nextEl: ".ryzj_content_1_right",
				prevEl: ".ryzj_content_1_left",
			},
			breakpoints: {
				1600: {
					slidesPerView: 6,
					spaceBetween: "60"
					},
				1360: {
						slidesPerView: 6,
						spaceBetween: "40"
						},
				 1024: {
					slidesPerView: 4,
					spaceBetween: 40
					},
				999: {
					   slidesPerView: 3,
					   spaceBetween: 20
					   },
				320: {
					slidesPerView: 2,
					spaceBetween: 20
					},
				0: {
					slidesPerView: 1,
					spaceBetween: 0
					},
			},
			lazy: true,
			pagination: {
				//el:".m_banner-pagination",
				clickable:true,
			},
			on: {
				
			},
			autoplay: false,
			loop: false
		})
	}

	if($(".about_2_content2").length>0){
		var banner_5 = new Swiper('.about_2_content2',{
			slidesPerView : 6,
			//centeredSlides: true,
			navigation: {
				nextEl: ".about_2_content4_right",
				prevEl: ".about_2_content4_left",
			},
			breakpoints: { 
				//当宽度小于等于768时显示
				1360: {
					slidesPerView: 6,
					spaceBetween: 0
					},
				 1024: {
					slidesPerView: 4,
					spaceBetween: 0
					},
				999: {
					   slidesPerView: 2,
					   spaceBetween: 0
					   },
				320: {
					slidesPerView: 2,
					spaceBetween: 0
					},
					0: {
						slidesPerView: 1,
						spaceBetween: 0
						},
			},
			lazy: true,
			pagination: {
				//el:".m_banner-pagination",
				clickable:true,
			},
			on: {
			},
			autoplay: false,
			loop: false
		})
	}

	if($(".about_2_content1").length>0){
		var banner_3 = new Swiper('.about_2_content1',{
			slidesPerView : 1,
			navigation: {
				//nextEl: ".arrow_2_right",
				//prevEl: ".arrow_2_left",
			},
			lazy: true,
			pagination: {
				//el:".m_banner-pagination",
				clickable:true,
			},
			
			effect:'fade',
			fadeEffect:{
				crossFade:true,
			},
			on: {
				slideChangeTransitionStart: function(){
					//if(this.activeIndex>$(".about_2_content2 li").index($(".about_2_content2 .cur")))
					//{

					//}
					//$(".about_2_content2 li").eq(this.activeIndex).trigger("click")
				}
			},
			autoplay: false,
			loop: false
		})
	}
	
	if($(".about_2_content3").length>0){
		var banner_4 = new Swiper('.about_2_content3',{
			slidesPerView : 1,
			navigation: {
				//nextEl: ".arrow_2_right",
				//prevEl: ".arrow_2_left",
			},
			lazy: true,
			pagination: {
				//el:".m_banner-pagination",
				clickable:true,
			},
			
			effect:'fade',
			fadeEffect:{
				crossFade:true,
			},
			on: {
				
			},
			autoplay: false,
			loop: false
		})
	}
	$(".about_2_content2 li").click(function(){
		let eq_1=$(".about_2_content2 li").index($(this))
		$(".about_2_content2 li").removeClass("cur").eq(eq_1).addClass("cur")
		banner_3.slideTo(eq_1);
		banner_4.slideTo(eq_1);
	})
	if($(".xwhd_s_content_t_1_1").length>0){
		var banner_2 = new Swiper('.xwhd_s_content_t_1_1',{
			slidesPerView : 1,
			navigation: {
				nextEl: ".arrow_2_right",
				prevEl: ".arrow_2_left",
			},
			lazy: true,
			pagination: {
				//el:".m_banner-pagination",
				clickable:true,
			},
			on: {
				
			},
			autoplay: {
				delay: 5000,
				stopOnLastSlide: false,
				disableOnInteraction: true,
			},
			loop: true
		})
	}

	if($(".m_banner").length>0){
		var banner = new Swiper('.m_banner',{
			slidesPerView : 1,
			navigation: {
				nextEl: ".m_banner_right",
				prevEl: ".m_banner_left",
			},
			lazy: true,
			pagination: {
				el:".m_banner-pagination",
				clickable:true,
			},
			on: {
				
			},
			// autoplay: {
			// 	delay: 5000,
			// 	stopOnLastSlide: false,
			// 	disableOnInteraction: true,
			// },
			autoplay:false,
            transitionStart: function () {
                if (this.activeIndex == 0 && $(".m_banner .swiper-slide").find("video").length > 0) {
                    $(".m_banner .swiper-slide").find("video").get(0).currentTime = 0;
                    $(".m_banner .swiper-slide").find("video").trigger("play");
                } else {
                    $(".m_banner .swiper-slide").find("video").trigger("pause");
                }
            },
			loop: false
		})
	}
	if($(".banner_news_main").length>0){
		new Swiper('.banner_news_main',{
			slidesPerView : 1,
			autoplay:true,
			loop: false
		})
	}

	
	if($(".m_whzz_1").length>0){
		var m_whzz_1 = new Swiper('.m_whzz_1',{
			slidesPerView : 1,
			navigation: {
				//nextEl: ".qy_left_1_right",
				//prevEl: ".qy_left_1_left",
			},
			lazy: true,
			pagination: {
				el:".m_whzz_1-pagination",
				clickable:true,
			},
			effect:'fade',
			fadeEffect:{
				crossFade:true,
			},
			on: {
                slideChangeTransitionStart: function () {
                    $(".m_whzz").css({ "background-image": "url(" + $(".m_whzz_1 li").eq(this.activeIndex).attr("attr-background")+")"});
                }
			},
			autoplay: {
				delay: 5000,
				stopOnLastSlide: false,
				disableOnInteraction: true,
			},
			loop: true
		})
	}

	if($(".wm_c1_1").length>0){
		var _initialSlide=0;
		var wm_c1_1_1 = new Swiper('.wm_c1_1',{ 
			initialSlide:_initialSlide,
			//centeredSlides: true,
			//allowTouchMove:false,
			slidesPerView: 4.05,
			spaceBetween : 0,
			breakpoints: { 
				//当宽度小于等于768时显示
				 1360: {
					slidesPerView: 4.05,
					spaceBetween: 0
					},
				 1024: {
					slidesPerView: 3.8,
					spaceBetween: 0
					},
				999: {
					   slidesPerView: 2.8,
					   spaceBetween: 0
					   },
				640: {
					slidesPerView: 2.1,
					spaceBetween: 0
					},
					0: {
						slidesPerView: 1.1,
						spaceBetween: 0
						},
			},
			loop: false,
			//autoplay:true,
			scrollbar: {
				el: '.heun',
				hide: false,
				draggable: true,
				snapOnRelease: true,
				//dragSize: 20,
			   },
			onSlideChangeStart: function(events){
			}
		  })
	}

	if($(".cjwy").length>0){
		var _initialSlide=0;
		var wm_c1_1_3 = new Swiper('.cjwy',{ 
			initialSlide:_initialSlide,
			//centeredSlides: true,
			//allowTouchMove:false,
			slidesPerView: 3,
			spaceBetween : 60,
			breakpoints: { 
				 1360: {
					slidesPerView: 3,
					spaceBetween: 60
					},
				320: {
					slidesPerView: 2,
					spaceBetween: 30
					},
					0: {
						slidesPerView: 1,
						spaceBetween: 0
						},
			},
			loop: false,
			//autoplay:true,
			scrollbar: {
				el: '.heun2',
				hide: false,
				draggable: true,
				snapOnRelease: true,
				//dragSize: 20,
			   },
			onSlideChangeStart: function(events){
			}
		  })
	}


})
