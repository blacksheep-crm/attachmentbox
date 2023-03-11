//EDUCATIONAL SAMPLE! DO NOT USE IN PRODUCTION!
//evolution of cboxPR.js
//uses Siebel inbound REST API to retrieve base64 string
//uses data URI feature
//requires Siebel 21.12 or higher
//requires custom Integration Objects and Business Objects to expose Attachment BC

var BCRM_B64 = new Map();

if (typeof (SiebelAppFacade.cbox2PR) === "undefined") {

	SiebelJS.Namespace("SiebelAppFacade.cbox2PR");
	define("siebel/custom/cbox2PR", ["siebel/jqgridrenderer"],
		function () {
			SiebelAppFacade.cbox2PR = (function () {

				function cbox2PR(pm) {
					SiebelAppFacade.cbox2PR.superclass.constructor.apply(this, arguments);
				}

				SiebelJS.Extend(cbox2PR, SiebelAppFacade.JQGridRenderer);

				cbox2PR.prototype.Init = function () {
					SiebelAppFacade.cbox2PR.superclass.Init.apply(this, arguments);
				}

				cbox2PR.prototype.ShowUI = function () {
					SiebelAppFacade.cbox2PR.superclass.ShowUI.apply(this, arguments);
				}

				cbox2PR.prototype.BindData = function (bRefresh) {
					SiebelAppFacade.cbox2PR.superclass.BindData.apply(this, arguments);
					var pm = this.GetPM();
					if (!pm.Get("GetBusComp").IsInQueryState()) {
						//list of extensions we can handle
						var exts = ["pdf", "jpg", "jpeg", "gif", "png"];
						var x = 0;
						var pm = this.GetPM();
						var rs = pm.Get("GetRawRecordSet");
						var ph = pm.Get("GetPlaceholder");
						var fi = pm.Get("GetFullId");
						var cs = pm.Get("GetControls");
						var ae = $("#" + fi);
						var rowId = "";
						var df = "";
						var ef = "";
						var ext = "";
						var tg;
						var f, r, ip;
						var pr = this;

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
								break;
							}
						}

						//for each record
						for (r in rs) {
							//limit to browser-supported file extensions
							ext = rs[r][ef];
							if (exts.indexOf(ext) > -1) {
								x = parseInt(r) + 1;
								rowId = rs[r]["Id"];
								//add row_id to URL
								//linkURL = pageURL + rowId;

								//modify target link
								tg = ae.find("td#" + x + "_" + ph + "_" + df + " > a");
								tg.attr("bcrm-cbox2", "true");
								tg.css("font-weight", "bold");
								tg.attr("bcrm_id", rowId);
								tg.attr("bcrm_ext", ext);

								//fetch base64 through Siebel REST API (requires 21.12 or higher and custom IO, see example below)
								//Asynchronous fetch for each record, this will cause heavy load on EAI OM!!!!
								var requestOptions = {
									method: 'GET',
									redirect: 'follow'
								};

								var url = location.origin;
								var bc = pm.Get("GetBusComp").GetName();
								//BO naming convention: "CORP_PREFIX " + BC
								var bo = "BCRM " + bc;

								//only fetch base64 once for each record
								//TBD: Implement refresh when record changes
								if (!BCRM_B64.has(rowId)) {
									fetch(url + ":443/siebel/v1.0/data/" + bo + "/" + bc + "/" + rowId + "?inlineattachment=true", requestOptions)
										.then(response => response.text())
										.then(result => {
											let r = JSON.parse(result);
											let row_id = r["Id"];
											let ext, base64;
											for (field in r) {
												if (field.indexOf("FileExt") > -1) {
													ext = r[field];
													break;
												}
											}
											for (field in r) {
												if (field.indexOf("Attachment Id") > -1) {
													base64 = r[field];
													break;
												}
											}
											let type = "data:image/";
											if (ext == "pdf") {
												type = "data:application/";
											}
											BCRM_B64.set(row_id, type + ext + ";base64," + base64);
											//update UI to indicate fetch is done
											ae.find("a[bcrm_id='" + row_id + "']").css("border-left", "4px solid");
										})
										.catch(error => console.log('error', error));
								}

								//redirect click
								tg.off("click");
								tg.on("click", function (e) {
									e.stopImmediatePropagation();
									let row_id = $(this).attr("bcrm_id");
									let ext = $(this).attr("bcrm_ext");
									let data_uri = BCRM_B64.get(row_id);
									//alternative: src=direct URL (not using global var), GET on click, use ?fields=*Attachment Id
									//example for Action BC
									data_uri = location.origin + ":443/siebel/v1.0/data/" + bo + "/" + bc + "/" + row_id + "?fields=Activity Attachment Id";
									if (ext != "pdf") {
										let img = $("<img>");
										img.attr("src", data_uri);
										img.dialog({
											title: $(this).text() + "." + ext,
											width: 1000,
											height: 800
										});
									}
									else {
										let c = $("<div>");
										let o = $("<iframe style='width: 96%!important;height: 90%!important;'>");
										let blob = pr.BCRMB64toBlob(BCRM_B64.get(row_id), "application/pdf");
										o.attr("src", URL.createObjectURL(blob));
										c.append(o);
										c.dialog({
											title: $(this).text() + "." + ext,
											width: 1000,
											height: 800
										});
									}
									return false;
								});

							}
						}//end for each record

						//rubber biscuit
						if (ae.find("#bcrm_rb").length == 0) {
							ae.find("#pager_" + ph + "_right").append("<div id='bcrm_rb'><span style='font-size:0.8em;color:#525252;margin-right:10px'>Custom PR: cbox2PR.js</span></div>");
						}
					}

				};

				//solution for large PDFs, source: https://stackoverflow.com/questions/40674532/how-to-display-base64-encoded-pdf
				cbox2PR.prototype.BCRMB64toBlob = function (b64Data, contentType) {
					contentType = contentType || '';
					var sliceSize = 512;
					b64Data = b64Data.replace(/^[^,]+,/, '');
					b64Data = b64Data.replace(/\s/g, '');
					var byteCharacters = window.atob(b64Data);
					var byteArrays = [];

					for (var offset = 0; offset < byteCharacters.length; offset = offset + sliceSize) {
						var slice = byteCharacters.slice(offset, offset + sliceSize);
						var byteNumbers = new Array(slice.length);
						for (var i = 0; i < slice.length; i++) {
							byteNumbers[i] = slice.charCodeAt(i);
						}
						var byteArray = new Uint8Array(byteNumbers);
						byteArrays.push(byteArray);
					}

					var blob = new Blob(byteArrays, { type: contentType });
					return blob;
				}

				cbox2PR.prototype.BindEvents = function () {
					SiebelAppFacade.cbox2PR.superclass.BindEvents.apply(this, arguments);
				}

				cbox2PR.prototype.EndLife = function () {
					SiebelAppFacade.cbox2PR.superclass.EndLife.apply(this, arguments);
				}

				return cbox2PR;
			}()
			);
			return "SiebelAppFacade.cbox2PR";
		})
}
