//Regenerate using:https://duncanford.github.io/prpm-code-generator/?prpm=PR&object=DesktopList&name=cbox&userprops=&comments=No&logging=No
//EDUCATIONAL SAMPLE! DO NOT USE IN PRODUCTION!
//requires colorbox
//https://github.com/jackmoore/colorbox/archive/master.zip
//By default, all files are downloaded.
//For demo, use a chrome extension for content disposition, for example:
//https://chrome.google.com/webstore/detail/modify-content-type/jnfofbopfpaoeojgieggflbpcblhfhka

if (typeof (SiebelAppFacade.cboxPR) === "undefined") {

	SiebelJS.Namespace("SiebelAppFacade.cboxPR");
	define("siebel/custom/cboxPR", ["siebel/jqgridrenderer"],
		function () {
			SiebelAppFacade.cboxPR = (function () {

				function cboxPR(pm) {
					SiebelAppFacade.cboxPR.superclass.constructor.apply(this, arguments);
				}

				SiebelJS.Extend(cboxPR, SiebelAppFacade.JQGridRenderer);

				cboxPR.prototype.Init = function () {
					SiebelAppFacade.cboxPR.superclass.Init.apply(this, arguments);
				}

				cboxPR.prototype.ShowUI = function () {
					SiebelAppFacade.cboxPR.superclass.ShowUI.apply(this, arguments);
				}

				cboxPR.prototype.BindData = function (bRefresh) {
					SiebelAppFacade.cboxPR.superclass.BindData.apply(this, arguments);
					//list of extensions that the browser can handle inside an iframe
					var exts = ["pdf", "jpg", "jpeg", "gif"];
					var x = 0;
					var pm = this.GetPM();
					var rs = pm.Get("GetRawRecordSet");
					var ph = pm.Get("GetPlaceholder");
					var fi = pm.Get("GetFullId");
					var cs = pm.Get("GetControls");
					var thisbc = pm.Get("GetBusComp").GetName();
					var ae = $("#" + fi);
					var pageURL = SiebelApp.S_App.GetPageURL();
					var vn = SiebelApp.S_App.GetActiveView().GetName();
					var am = SiebelApp.S_App.GetActiveView().GetAppletMap();
					var an = pm.GetObjName();
					var linkURL = "";
					var rowId = "";
					var df = "";
					var ef = "";
					var ext = "";
					var tg;
					var f, r, ip;
					var pa, pam;
					var prowid;

					//get full field names for drilldown/name (df) and extension (ef)
					for (f in rs[0]) {
						if (f.indexOf("FileName") > -1) {
							df = f;
						}
						if (f.indexOf("FileExt") > -1) {
							ef = f;
						}
					}

					//get name field's control input name
					for (c in cs) {
						if (cs[c].GetFieldName() == df) {
							ip = cs[c].GetInputName();
						}
					}

					//get parent ROW_ID, if there are applets on different BCs
					//very primitive, will likely work with a "standard" parent/child view, but could break any moment
					for (a in am) {
						if (am[a].GetBusComp().GetName() != thisbc) {
							pa = am[a];
							break;
						}
					}
					if (typeof (pa) !== "undefined") {
						pam = pa.GetPModel();
						prowid = pam.Get("GetRawRecordSet")[pam.Get("GetSelection")]["Id"];
					}

					/* Example Drilldown request with attachment as child BC:
						SWEField: s_2_2_27_1
						SWER: 1
						SWERowIds: SWERowId0=8SIA-7KJNH
						SWEApplet: Service Request Attachment List Applet
						SWEActiveApplet: Service Request Attachment List Applet
						SWEBCFField: ActivityFileName
					s_2_2_27_0: _object__ The External Object element - HTML_ HyperText Markup Language _ MDN (38)
					s_2_2_33_0: Y
					s_2_2_34_0: 
					s_2_1_10_0: 
					s_2_1_11_0: 
						SWECmd: InvokeMethod
						SWEVI: 
						SWEView: Service Request detail view w/attachments
						SWEMethod: Drilldown
						SWERowId: 9SIA-CD37T
						SWEReqRowId: 1
						SWENeedContext: true
						SWEC: 66
						SWERPC: 1
					SRN: rq76ukukr45vqaosc5iq2mdhai098n07gh50r0mf74id
						SWEActiveView: Service Request detail view w/attachments
					SWETS: 1644143259999
					*/

					//generate drilldown URL template
					pageURL += "?SWECmd=InvokeMethod&SWEMethod=Drilldown&SWEField=" + ip;
					pageURL += "&SWEBCField=" + df;
					pageURL += "&SWEView=" + vn.replaceAll(" ", "+");
					pageURL += "&SWEApplet=" + an.replaceAll(" ", "+");
					pageURL += "&SWEActiveView=" + vn.replaceAll(" ", "+");
					pageURL += "&SWEActiveApplet=" + an.replaceAll(" ", "+");
					if (typeof (prowid) !== "undefined") {
						pageURL += "&SWERowIds=SWERowId0=" + prowid;
					}
					//add custom marker (can be used to identify request for browser plug-in or rewrite rule)
					pageURL += "&BCRMCBOX=1"
					pageURL += "&SWEReqRowId=1&SWERowId=";


					//for each record
					for (r in rs) {
						//limit to browser-supported file extensions
						ext = rs[r][ef];
						if (exts.indexOf(ext) > -1) {
							x = parseInt(r) + 1;
							rowId = rs[r]["Id"];
							//add row_id to URL
							linkURL = pageURL + rowId;

							//modify target link
							tg = ae.find("td#" + x + "_" + ph + "_" + df + " > a");
							tg.attr("bcrm-cbox", "true");
							tg.attr("href", linkURL);
							tg.css("font-weight", "bold");

							//cancel download popup
							tg.on("click", function () {
								setTimeout(function () {
									$(".ui-dialog-buttonset").find("button#cancelButton").click();
								}, 500);
							});

						}
					}//end for each record

					//identify all modified targets
					var target = ae.find("a[bcrm-cbox=true]");

					//enable colorbox
					target.colorbox({
						rel: "drilldown",
						iframe: true,
						width: "90%",
						height: "90%",
						slideshow: true,
						slideshowAuto: false,
						current: "attachment {current} of {total}"
					});

					//rubber biscuit
					if (ae.find("#bcrm_rb").length == 0) {
						ae.find("#pager_" + ph + "_right").append("<div id='bcrm_rb'><span style='font-size:0.8em;color:#525252;margin-right:10px'>This applet supports colorbox</span></div>");
					}
				};

				cboxPR.prototype.BindEvents = function () {
					SiebelAppFacade.cboxPR.superclass.BindEvents.apply(this, arguments);
				}

				cboxPR.prototype.EndLife = function () {
					SiebelAppFacade.cboxPR.superclass.EndLife.apply(this, arguments);
				}

				return cboxPR;
			}()
			);
			return "SiebelAppFacade.cboxPR";
		})
}
