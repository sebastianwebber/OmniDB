/*
Copyright 2015-2017 The OmniDB Team

This file is part of OmniDB.

OmniDB is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

OmniDB is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with OmniDB. If not, see http://www.gnu.org/licenses/.
*/

var v_browserTabActive = true;

/// <summary>
/// Startup function.
/// </summary>
$(function () {
	$(window).focus(function() {
	    v_browserTabActive = true;
	    document.title = 'OmniDB';
	});

	$(window).blur(function() {
	    v_browserTabActive = false;
	});

	v_copyPasteObject = new Object();

	v_copyPasteObject.v_tabControl = createTabControl('find_replace',0,null);
	v_copyPasteObject.v_tabControl.selectTabIndex(0);

	v_connTabControl = createTabControl('conn_tabs',0,null);

	initCreateTabFunctions();

	v_connTabControl.tag.createSnippetTab();

	var v_tab = v_connTabControl.createTab('+',false,v_connTabControl.tag.createConnTab,false);

	getDatabaseList();

	//Prevent "cannot edit" bug in ace editor
	$(document).on(
		'mouseenter',
		'.ace_editor',
		function(p_event) {
			var v_textarea = this.querySelector('.ace_text-input');

			if(v_textarea != null) {
				v_textarea.blur();
				v_textarea.focus();
			}
		}
	);

	//Improve mouse wheel scrolling in grid div. Whitout this, it scrolls just 1 pixel at a time
	$(document).on(
		'wheel',
		'.ht_master > .wtHolder',
		function(p_event) {
			if(p_event.originalEvent.deltaY > 0) {
				this.scrollTop += 19;
			}
			else {
				this.scrollTop -= 19;
			}
		}
	)

	var v_keyBoardShortCuts = function(p_event) {
		var v_tabControl = null;

		if((p_event.ctrlKey || p_event.metaKey) && p_event.shiftKey) {
			v_tabControl = v_connTabControl;
		}
		else if(p_event.ctrlKey || p_event.metaKey) {
			v_tabControl = v_connTabControl.selectedTab.tag.tabControl;
		}
		if(v_tabControl != null) {
			switch(p_event.keyCode) {
				case 188: {//'<'
					p_event.preventDefault();
					p_event.stopPropagation();

					var v_actualIndex = v_tabControl.tabList.indexOf(v_tabControl.selectedTab);

					switch(v_actualIndex) {
						case 0: {
							v_tabControl.tabList[v_tabControl.tabList.length - 2].elementLi.click();//avoid triggering click on '+' tab
							break;
						}
						default: {
							v_tabControl.tabList[v_actualIndex - 1].elementLi.click();
							break;
						}
					}

					break;
				}
				case 190: {//'>'
					p_event.preventDefault();
					p_event.stopPropagation();

					var v_actualIndex = v_tabControl.tabList.indexOf(v_tabControl.selectedTab);

					switch(v_actualIndex) {
						case (v_tabControl.tabList.length - 2): {//avoid triggering click on '+' tab
							v_tabControl.tabList[0].elementLi.click();
							break;
						}
						default: {
							v_tabControl.tabList[v_actualIndex + 1].elementLi.click();
							break;
						}
					}

					break;
				}
				case 46: {//delete
					p_event.preventDefault();
					p_event.stopPropagation();

					if(v_tabControl.id == 'conn_tabs') {
						if(v_tabControl.tabList.indexOf(v_tabControl.selectedTab) != 0 && v_tabControl.tabList.length > 2) {//not snippet tab and cannot delete '+' tab
							v_tabControl.selectedTab.elementClose.click();
						}
					}
					else {
						if(v_tabControl.tabList.length > 1) {//cannot delete '+' tab
							v_tabControl.selectedTab.elementClose.click();
						}
					}

					break;
				}
				case 45: {//insert
					p_event.preventDefault();
					p_event.stopPropagation();

					v_tabControl.tabList[v_tabControl.tabList.length - 1].elementLi.click();

					break;
				}
				case 69: {// 'e'
					p_event.preventDefault();
					p_event.stopPropagation();

					if(v_tabControl.selectedTab.tag.bt_start != null) {
						v_tabControl.selectedTab.tag.bt_start.click();
					}

					break;
				}
				case 83: {// 's'
					p_event.preventDefault();
					p_event.stopPropagation();

					if(v_tabControl.selectedTab.tag.bt_save != null) {
						v_tabControl.selectedTab.tag.bt_save.click();
					}
					else if(v_tabControl.selectedTab.tag.btSave != null) {
						v_tabControl.selectedTab.tag.btSave.click();
					}
					else if(v_tabControl.selectedTab.tag.button_save != null) {
						v_tabControl.selectedTab.tag.button_save.click();
					}

					break;
				}
			}
		}
	}

	//Some keyboard shortcuts
	document.body.addEventListener(
		'keydown',
		v_keyBoardShortCuts
	)
/*
	//WebSockets
	startChatWebSocket(2011, v_enable_omnichat);

	if(!v_enable_omnichat) {
		document.getElementById('div_chat').style.display = 'none';
	}
*/
	startQueryWebSocket(v_query_port);
});

/// <summary>
/// Retrieves database list.
/// </summary>
/// <param name="p_sel_id">Selection tag ID.</param>
/// <param name="p_filter">Filtering a specific database technology.</param>
function getDatabaseList() {

	execAjax('/get_database_list/',
			JSON.stringify({}),
			function(p_return) {

				v_connTabControl.tag.selectHTML = p_return.v_data.v_select_html;
				v_connTabControl.tag.connections = p_return.v_data.v_connections;
				v_connTabControl.tag.createConnTab(v_selected_connection);

			},
			null,
			'box');

}

/// <summary>
/// Changing selected database.
/// </summary>
/// <param name="p_sel_id">Selection tag ID.</param>
/// <param name="p_value">Database ID.</param>
function changeDatabase(p_value) {

	v_connTabControl.selectedTab.tag.selectedDatabaseIndex = parseInt(p_value);

	v_connTabControl.selectedTab.renameTab('<img src="/static/OmniDB_app/images/' + v_connTabControl.tag.connections[p_value].v_db_type + '_medium.png"/> ' + v_connTabControl.tag.connections[p_value].v_alias);

	if (v_connTabControl.tag.connections[p_value].v_db_type=='postgresql')
		getTreePostgresql(v_connTabControl.selectedTab.tag.divTree.id);
	else
		getTree(v_connTabControl.selectedTab.tag.divTree.id);

}

/// <summary>
/// Opens copy & paste window.
/// </summary>
function showFindReplace(p_editor) {

	v_copyPasteObject.v_editor = p_editor;

	$('#div_find_replace').show();

	document.getElementById('txt_replacement_text').value = '';
	document.getElementById('txt_replacement_text_new').value = '';

}

/// <summary>
/// Hides copy & paste window.
/// </summary>
function replaceText() {

	var v_old_text = v_copyPasteObject.v_editor.getValue();

	var v_new_text = v_old_text.split(document.getElementById('txt_replacement_text').value).join(document.getElementById('txt_replacement_text_new').value);

	v_copyPasteObject.v_editor.setValue(v_new_text);

	hideFindReplace();

}

/// <summary>
/// Opens copy & paste window.
/// </summary>
function hideFindReplace() {

	$('#div_find_replace').hide();

}

/// <summary>
/// Renames tab.
/// </summary>
/// <param name="p_tab">Tab object.</param>
function renameTab(p_tab) {

	showConfirm('<input id="tab_name"/ value="' + p_tab.tag.tab_title_span.innerHTML + '" style="width: 200px;">',
	            function() {

					renameTabConfirm(p_tab,document.getElementById('tab_name').value);

	            });

}

/// <summary>
/// Renames tab.
/// </summary>
/// <param name="p_tab">Tab object.</param>
/// <param name="p_name">New name.</param>
function renameTabConfirm(p_tab, p_name) {

	p_tab.tag.tab_title_span.innerHTML=p_name;

}

/// <summary>
/// Removes tab.
/// </summary>
/// <param name="p_tab">Tab object.</param>
function removeTab(p_tab) {

	showConfirm('Are you sure you want to remove this tab?',
                function() {
                	p_tab.removeTab();
                	if (p_tab.tag.ht!=null) {
										p_tab.tag.ht.destroy();
										p_tab.tag.div_result.innerHTML = '';
									}

									if (p_tab.tag.editor!=null)
										p_tab.tag.editor.destroy();

									if (p_tab.tag.mode='query') {
										//console.log('closing query tab')
									}
                });

}

/// <summary>
/// Redefines vertical resize line position.
/// </summary>
function verticalLinePosition(p_event) {
	document.getElementById('vertical-resize-line').style.top = p_event.pageY;
}

function resizeWindow(){
	refreshHeights(true);
}

var resizeTimeout;
$(window).resize(function() {
	clearTimeout(resizeTimeout);
	resizeTimeout = setTimeout(resizeWindow, 200);
});

function refreshTreeHeight() {
	var v_tree = v_connTabControl.selectedTab.tag.divTree;

	if (v_tree) {
		var v_height  = window.innerHeight - $(v_tree).offset().top - 12;
		v_tree.style.height = v_height + "px";
	}
}

function refreshHeights(p_all) {

	//Adjusting tree height
	if (p_all) {
		refreshTreeHeight();
	}

	//If inner tab exists
	if (v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag) {
		var v_tab_tag = v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag;

		//Snippet tab, adjust editor only
		if (v_tab_tag.mode=='snippet') {
			v_tab_tag.editorDiv.style.height = window.innerHeight - $(v_tab_tag.editorDiv).offset().top - 62 + 'px';
			v_tab_tag.editor.resize();
		}
		else if (v_tab_tag.mode=='query') {
			v_tab_tag.div_result.style.height = window.innerHeight - $(v_tab_tag.div_result).offset().top - 21 + 'px';
			if (v_tab_tag.ht!=null)
				v_tab_tag.ht.render();
		}
		else if (v_tab_tag.mode=='monitoring') {
			v_tab_tag.div_result.style.height = window.innerHeight - $(v_tab_tag.div_result).offset().top - 21 + 'px';
			if (v_tab_tag.ht!=null)
				v_tab_tag.ht.render();
		}
		else if (v_tab_tag.mode=='graph') {
			v_tab_tag.graph_div.style.height = window.innerHeight - $(v_tab_tag.graph_div).offset().top - 20 + "px";

		}
		else if (v_tab_tag.mode=='website') {
			v_tab_tag.iframe.style.height = window.innerHeight - $(v_tab_tag.iframe).offset().top - 20 + "px";
		}
		else if (v_tab_tag.mode=='website_outer') {
			v_tab_tag.iframe.style.height = window.innerHeight - $(v_tab_tag.iframe).offset().top - 12 + "px";
		}
		else if (v_tab_tag.mode=='edit') {
			v_tab_tag.div_result.style.height = window.innerHeight - $(v_tab_tag.div_result).offset().top - 21 + 'px';
			if (v_tab_tag.editDataObject.ht!=null) {
				v_tab_tag.editDataObject.ht.render();
			}
		}
		else if (v_tab_tag.mode=='alter') {
			if (v_tab_tag.alterTableObject.window=='columns') {
				var v_height = window.innerHeight - $(v_tab_tag.htDivColumns).offset().top - 59;
				v_tab_tag.htDivColumns.style.height = v_height + 'px';
				if (v_tab_tag.alterTableObject.htColumns!=null) {
					v_tab_tag.alterTableObject.htColumns.render();
				}
			}
			else if (v_tab_tag.alterTableObject.window=='constraints') {
				var v_height = window.innerHeight - $(v_tab_tag.htDivConstraints).offset().top - 59;
				v_tab_tag.htDivConstraints.style.height = v_height + 'px';
				if (v_tab_tag.alterTableObject.htConstraints!=null) {
					v_tab_tag.alterTableObject.htConstraints.render();
				}
			}
			else {
				var v_height = window.innerHeight - $(v_tab_tag.htDivIndexes).offset().top - 59;
				v_tab_tag.htDivIndexes.style.height = v_height + 'px';
				if (v_tab_tag.alterTableObject.htIndexes!=null) {
					v_tab_tag.alterTableObject.htIndexes.render();
				}
			}
		}
	}

}




/// <summary>
/// Resize SQL editor and result div.
/// </summary>
function resizeVertical(event) {
	var v_verticalLine = document.createElement('div');
	v_verticalLine.id = 'vertical-resize-line';
	document.body.appendChild(v_verticalLine);

	document.body.addEventListener(
		'mousemove',
		verticalLinePosition
	)

	v_start_height = event.screenY;
	document.body.addEventListener("mouseup", resizeVerticalEnd);

}

/// <summary>
/// Resize SQL editor and result div.
/// </summary>
function resizeVerticalEnd(event) {

	document.body.removeEventListener("mouseup", resizeVerticalEnd);
	document.getElementById('vertical-resize-line').remove();

	document.body.removeEventListener(
		'mousemove',
		verticalLinePosition
	)

	var v_height_diff = event.screenY - v_start_height;

	var v_editor_div = document.getElementById(v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.editorDivId);
	var v_result_div = v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.div_result;

	if (v_height_diff < 0) {
		if (Math.abs(v_height_diff) > parseInt(v_editor_div.style.height, 10))
		 v_height_diff = parseInt(v_editor_div.style.height, 10)*-1 + 10;
	}
	else {
		if (Math.abs(v_height_diff) > parseInt(v_result_div.style.height, 10))
		 v_height_diff = parseInt(v_result_div.style.height, 10) - 10;
	}

	v_editor_div.style.height = parseInt(v_editor_div.style.height, 10) + v_height_diff + 'px';
	v_result_div.style.height = parseInt(v_result_div.style.height, 10) - v_height_diff + 'px';

	v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.editor.resize();

	if (v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.mode=='query') {
		if (v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.ht!=null)
			v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.ht.render();
	}
	else {
		if (v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.editDataObject.ht!=null) {
			v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.editDataObject.ht.render();
		}
	}
}

/// <summary>
/// Maximize SQL Editor.
/// </summary>
function maximizeEditor() {

	var v_editor_div = document.getElementById(v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.editorDivId);
	var v_result_div = v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.div_result;

	var v_height_diff = parseInt(v_result_div.style.height, 10) - 10;

	v_editor_div.style.height = parseInt(v_editor_div.style.height, 10) + v_height_diff + 'px';
	v_result_div.style.height = parseInt(v_result_div.style.height, 10) - v_height_diff + 'px';

	v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.editor.resize();

}

/// <summary>
/// Minimize SQL Editor.
/// </summary>
function minimizeEditor() {

	var v_editor_div = document.getElementById(v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.editorDivId);
	var v_result_div = v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.div_result;

	var v_height_diff = parseInt(v_editor_div.style.height, 10) - 10;


	v_result_div.style.height = (parseInt(v_result_div.style.height, 10) + parseInt(v_editor_div.style.height, 10) - 300) + 'px';

	v_editor_div.style.height = '300px';

	v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.editor.resize();

}

/// <summary>
/// Redefines horizontal resize line position.
/// </summary>
function horizontalLinePosition(p_event) {
	document.getElementById('horizontal-resize-line').style.left = p_event.pageX;
}

/// <summary>
/// Resize Tab.
/// </summary>
function resizeHorizontal(event) {
	var v_horizontalLineBase = document.createElement('div');
	v_horizontalLineBase.id = 'horizontal-resize-line-base';
	v_horizontalLineBase.style.position = 'absolute';
	v_horizontalLineBase.style.width = '100%';
	v_horizontalLineBase.style.height = '100%';
	v_horizontalLineBase.style.left = '0';
	v_horizontalLineBase.style.top = '0';
	var v_horizontalLine = document.createElement('div');
	v_horizontalLine.id = 'horizontal-resize-line';
	document.body.appendChild(v_horizontalLineBase);
	v_horizontalLineBase.appendChild(v_horizontalLine)

	document.body.addEventListener(
		'mousemove',
		horizontalLinePosition
	)

	document.body.addEventListener("mouseup", resizeHorizontalEnd);
	v_start_width = event.screenX;
}

/// <summary>
/// Resize Tab.
/// </summary>
function resizeHorizontalEnd(event) {
	document.body.removeEventListener("mouseup", resizeHorizontalEnd);
	document.getElementById('horizontal-resize-line-base').remove();

	document.body.removeEventListener(
		'mousemove',
		horizontalLinePosition
	)

	var v_width_diff = event.screenX - v_start_width;

	v_width_diff = Math.ceil(v_width_diff/window.innerWidth*100);

	var v_left_div = v_connTabControl.selectedTab.tag.divLeft;
	var v_right_div = v_connTabControl.selectedTab.tag.divRight;

	v_left_div.style.width = parseInt(v_left_div.style.width, 10) + v_width_diff + '%';
	v_right_div.style.width = parseInt(v_right_div.style.width, 10) - v_width_diff + '%';

	if (v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.mode=='query') {
		v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.editor.resize();
		if (v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.ht!=null) {
			v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.ht.render();
		}
	}
	else if (v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.mode=='edit') {
		v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.editor.resize();
		if (v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.editDataObject.ht!=null)
			v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.editDataObject.ht.render();
	}
	else if (v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.mode=='snippet') {
		v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.editor.resize();
	}
	else if (v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.mode=='monitoring') {
		if (v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.ht!=null) {
			v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.ht.render();
		}
	}
	else if (v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.mode=='alter') {
        v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.tabControl.selectedTab.tag.ht.render();
	}

}


function checkTabStatus(v_tab) {

	if (v_tab.tag.tabControl.selectedTab.tag.mode=='query')
		checkQueryStatus(v_tab.tag.tabControl.selectedTab);
	else if (v_tab.tag.tabControl.selectedTab.tag.mode=='edit')
		checkEditDataStatus(v_tab.tag.tabControl.selectedTab);

}

/// <summary>
/// Removes tab.
/// </summary>
/// <param name="p_tab">Tab object.</param>
function closeGraphTab(p_tab) {

	showConfirm('Are you sure you want to close this graph tab?',
                function() {
									if (v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.network) {
										v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.network.destroy();
									}
									p_tab.removeTab();
                });
}

/// <summary>
/// Indent SQL.
/// </summary>
function indentSQL() {

	var v_tab_tag = v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag;
	var v_sql_value = v_tab_tag.editor.getValue();

	if (v_sql_value.trim()=='') {
		showAlert('Please provide a string.');
	}
	else {
		execAjax('/indent_sql/',
				JSON.stringify({"p_sql": v_sql_value}),
				function(p_return) {

					v_tab_tag.editor.setValue(p_return.v_data);
					v_tab_tag.editor.clearSelection();
					v_tab_tag.editor.gotoLine(0, 0, true);

				},
				null,
				'box');
	}
}

/// <summary>
/// Draws graph.
/// </summary>
function drawGraph(p_all, p_schema) {

	execAjax('/draw_graph/',
			JSON.stringify({"p_database_index": v_connTabControl.selectedTab.tag.selectedDatabaseIndex,
											"p_complete": p_all,
											"p_schema": p_schema}),
			function(p_return) {

          v_nodes = [];
          v_edges = [];

          for (var i=0; i<p_return.v_data.v_nodes.length; i++)
          {

	        	var v_node_object = new Object();
						v_node_object.data = new Object();
						v_node_object.position = new Object();
						v_node_object.data.id = p_return.v_data.v_nodes[i].id;
						v_node_object.data.label = p_return.v_data.v_nodes[i].label;
						v_node_object.classes = 'group' + p_return.v_data.v_nodes[i].group;

						v_nodes.push(v_node_object);

          }

          for (var i=0; i<p_return.v_data.v_edges.length; i++)
          {

          	var v_edge_object = new Object();
						v_edge_object.data = new Object();
						v_edge_object.data.source = p_return.v_data.v_edges[i].from;
						v_edge_object.data.target = p_return.v_data.v_edges[i].to;
						v_edge_object.data.label = p_return.v_data.v_edges[i].label;
						v_edge_object.data.faveColor = '#9dbaea';
						v_edge_object.data.arrowColor = '#9dbaea';
						v_edges.push(v_edge_object);

          }

					v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.network = window.cy = cytoscape({
						container: v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.graph_div,
						boxSelectionEnabled: false,
						autounselectify: true,
						layout: {
							name: 'cose',
	            			idealEdgeLength: 100,
	            			nodeOverlap: 20
						},
						style: [
							{
								selector: 'node',
								style: {
									'content': 'data(label)',
									'text-opacity': 0.5,
									'text-valign': 'top',
									'text-halign': 'right',
									'background-color': '#11479e',
									'text-wrap': 'wrap',


								}
							},
							{
								selector: 'node.group0',
								style: {
									'background-color': 'slategrey',
									'shape': 'square'
								}
							},
							{
								selector: 'node.group1',
								style: {
									'background-color': 'blue'
								}
							},
							{
								selector: 'node.group2',
								style: {
									'background-color': 'cyan'
								}
							},
							{
								selector: 'node.group3',
								style: {
									'background-color': 'lightgreen'
								}
							},
							{
								selector: 'node.group4',
								style: {
									'background-color': 'yellow'
								}
							},
							{
								selector: 'node.group5',
								style: {
									'background-color': 'orange'
								}
							},
							{
								selector: 'node.group6',
								style: {
									'background-color': 'red'
								}
							},

							{
								selector: 'edge',
								style: {
									'curve-style': 'bezier',
							        'target-arrow-shape': 'triangle',
							        'target-arrow-color': 'data(faveColor)',
							        'line-color': 'data(arrowColor)',
							        'text-opacity': 0.75,
							        'width': 2,
							        'control-point-distances': 50,
							        'content': 'data(label)',
							        'text-wrap': 'wrap',
							        'edge-text-rotation': 'autorotate',
							        'line-style': 'solid'
								}
							}
						],

						elements: {
							nodes: v_nodes,
							edges: v_edges
						},
					});

			},
			function(p_return) {
				if (p_return.v_data.password_timeout) {
					showPasswordPrompt(
						v_connTabControl.selectedTab.tag.selectedDatabaseIndex,
						function() {
							drawGraph(p_all, p_schema);
						},
						null,
						p_return.v_data.message
					);
				}
			},
			'box');
}

/// <summary>
/// Hides command history window.
/// </summary>
function hideCommandsLog() {

	$('#div_commands_log').hide();

}

/// <summary>
/// Refreshes monitoring tab.
/// </summary>
function refreshMonitoring(p_tab_tag) {

	if (!p_tab_tag)
		var p_tab_tag = v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag;

	execAjax('/refresh_monitoring/',
			JSON.stringify({"p_database_index": v_connTabControl.selectedTab.tag.selectedDatabaseIndex,
											"p_query": p_tab_tag.query}),
			function(p_return) {

				var v_data = p_return.v_data;

				if (p_tab_tag.ht!=null) {
					p_tab_tag.ht.destroy();
					p_tab_tag.ht = null;
				}

				p_tab_tag.query_info.innerHTML = v_data.v_query_info;

				var columnProperties = [];

				var v_fixedColumnsLeft = 0;

				if (p_tab_tag.actions!=null) {
					v_fixedColumnsLeft = 1;
					for (var i=0; i<v_data.v_data.length; i++) {
						var v_actions_html = '';
						for (var j=0; j<p_tab_tag.actions.length; j++) {
							v_actions_html += '<img class="img_ht" title="' + p_tab_tag.actions[j].title + '" src="' + p_tab_tag.actions[j].icon + '" onclick="monitoringAction(' + i + ',&apos;' + p_tab_tag.actions[j].action + '&apos;)">';
						}
						v_data.v_data[i].unshift(v_actions_html);
					}

					var col = new Object();
			    col.readOnly = true;
			    col.title =  'Actions';
					col.renderer = 'html';
					columnProperties.push(col);

				}


				for (var i = 0; i < v_data.v_col_names.length; i++) {
			    var col = new Object();
			    col.readOnly = true;
			    col.title =  v_data.v_col_names[i];
					columnProperties.push(col);
				}

				p_tab_tag.ht = new Handsontable(p_tab_tag.div_result,
				{
					data: v_data.v_data,
					columns : columnProperties,
					colHeaders : true,
					rowHeaders : true,
					fixedColumnsLeft: v_fixedColumnsLeft,
					copyRowsLimit : 1000000000,
					copyColsLimit : 1000000000,
					manualColumnResize: true,
					contextMenu: {
						callback: function (key, options) {
							if (key === 'view_data') {
							  	editCellData(this,options.start.row,options.start.col,this.getDataAtCell(options.start.row,options.start.col),false);
							}
						},
						items: {
							"view_data": {name: '<div style=\"position: absolute;\"><img class="img_ht" src=\"/static/OmniDB_app/images/rename.png\"></div><div style=\"padding-left: 30px;\">View Content</div>'}
						}
				    },
			        cells: function (row, col, prop) {
					    var cellProperties = {};
					    if (row % 2 == 0)
							cellProperties.renderer = blueHtmlRenderer;
						else
							cellProperties.renderer = whiteHtmlRenderer;
					    return cellProperties;
					}
				});

			},
			function(p_return) {
				if (p_return.v_data.password_timeout) {
					showPasswordPrompt(
						v_connTabControl.selectedTab.tag.selectedDatabaseIndex,
						function() {
							refreshMonitoring(p_tab_tag);
						},
						null,
						p_return.v_data.message
					);
				}
				else {
					showError(p_return.v_data);
				}
			},
			'box',
			true);

}

function monitoringAction(p_row_index, p_function) {
	var v_fn = window[p_function];
	var v_row_data = v_connTabControl.selectedTab.tag.tabControl.selectedTab.tag.ht.getDataAtRow(p_row_index);
	v_row_data.shift();
	if(typeof v_fn === 'function') {
		v_fn(v_row_data);
	}
}

function addLoadingCursor() {
	document.body.classList.add("cursor_loading");
}

function removeLoadingCursor() {
	document.body.classList.remove("cursor_loading");
}
