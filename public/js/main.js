(function($) {

	"use strict";

	var fullHeight = function() {

		$('.js-fullheight').css('height', $(window).height());
		$(window).resize(function(){
			$('.js-fullheight').css('height', $(window).height());
		});

	};
	fullHeight();

	$('#sidebarCollapse').on('click', function () {
      $('#sidebar').toggleClass('active');
  });

})(jQuery);

/**
 * This function retrieves the value of a cookie by its name from the document's cookies.
 * @param {*} name : The name of the cookie to retrieve.
 */
function getCookie(name) {
	let matches = document.cookie.match(new RegExp(
		"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	));
	return matches ? decodeURIComponent(matches[1]) : undefined;
}

var userData = JSON.parse(getCookie('user'));

var sender_id = userData._id;
var receiver_id;
var socket = io('/user-namespace', {
	auth:{
		token: userData._id
	}
});

$(document).ready(function(){
	$('.user-list').click(function(){
		var userId = $(this).attr('data-id');
		receiver_id = userId;

		$('.start-head').hide();
		$('.chat-section').show();

		socket.emit('existsChats', {sender_id:sender_id, receiver_id:receiver_id});
	});
});

socket.on('getOnlineUser', function(data){
	$('#'+data.user_id+'-status').text('Online');
	$('#'+data.user_id+'-status').removeClass('offline-status');
	$('#'+data.user_id+'-status').addClass('online-status');
});

socket.on('getOfflineUser', function(data){
	$('#'+data.user_id+'-status').text('Offline');
	$('#'+data.user_id+'-status').removeClass('online-status');
	$('#'+data.user_id+'-status').addClass('offline-status');
});

$('#chat-form').submit(function(event){
	event.preventDefault();

	var message = $('#message').val();

	$.ajax({
		url:'/save-chat',
		type:'POST',
		data:{ sender_id: sender_id, receiver_id: receiver_id, message: message },
		success: function(response){
			if(response.success)
			{
				$('#message').val('');
				let chat = response.data.message;
				let html = `
				<div class="current-user-chat" id="`+response.data._id+`">
					<span>`+chat+`</span>
					<i class="fa fa-edit" aria-hidden="true" data-id="`+response.data._id+`" data-msg="`+chat+`"
						data-toggle="modal" data-target="#editChatModal">
					</i>
					<i class="fa fa-trash" aria-hidden="true" data-id="`+response.data._id+`"
						data-toggle="modal" data-target="#deleteChatModal">
					</i>
				</div>
				`;
				$('#chat-container').append(html);
				scrollChat();
				socket.emit('newChat', response.data);
			}
			else {
				alert(response.msg);
			}
		}
	});
});

socket.on('loadNewChat', function(data){
	if(sender_id == data.receiver_id && receiver_id == data.sender_id){
		let html = `
		<div class="distance-user-chat" id="`+data._id+`">
			<span>`+data.message+`<span>
		</div>
		`;
		$('#chat-container').append(html);
		scrollChat();
	}
})

/**
 * Load old chats (all one-to-one chats) from MongoDB
 */
socket.on('loadChats', function(data){
	$('#chat-container').html('');

	var chats = data.chats;

	let html = '';

	for(let x=0; x<chats.length; x++){
		if(sender_id == chats[x]['sender_id']){
			html += `
			<div class="current-user-chat" id="`+chats[x]['_id']+`">
				<span>`+chats[x]['message']+`</span>
				<i class="fa fa-edit" aria-hidden="true" data-id="`+chats[x]['_id']+`" data-msg="`+chats[x]['message']+`"
					data-toggle="modal" data-target="#editChatModal">
				</i>
				<i class="fa fa-trash" aria-hidden="true" data-id="`+chats[x]['_id']+`"
					data-toggle="modal" data-target="#deleteChatModal">
				</i>
			</div>
			`;
		}
		if(sender_id == chats[x]['receiver_id']){
			html += `
			<div class="distance-user-chat" id="`+chats[x]['_id']+`">
				<span>`+chats[x]['message']+`</span>
			</div>
			`;
		}
	}
	$('#chat-container').append(html);
	scrollChat();
});

function scrollChat(){
	$('#chat-container').animate({
		scrollTop:$('#chat-container').offset().top + $('#chat-container')[0].scrollHeight
	},0);
}

/**
 * Delete chat message
 */
$(document).on('click', '.fa-trash', function(){
	let msg = $(this).parent().text();
	$('#delete-message').text(msg);
	$('#delete-message-id').val($(this).attr('data-id'));
});

$('#delete-chat-form').submit(function(event){
	event.preventDefault();

	let id = $('#delete-message-id').val();
	$.ajax({
		url: '/delete-chat',
		type:'POST',
		data:{id:id},
		success:function(response){
			if(response.success == true){
				$('#'+id).remove();
				$('#deleteChatModal').modal('hide');
				socket.emit('chatDeleted',id);
			}
			else
				alert(response.msg);
		}
	});
});

socket.on('chatMessageDeleted', function(id){
	$('#'+id).remove();
});

/**
 * Update user chat functionality
 */
$(document).on('click', '.fa-edit', function(){
	$('#edit-message-id').val( $(this).attr('data-id') );
	$('#edit-message').val( $(this).attr('data-msg') );
});

/**
 * Edit chat message
 */
$('#update-chat-form').submit(function(event){
	event.preventDefault();

	var id = $('#edit-message-id').val();
	var msg = $('#edit-message').val();

	$.ajax({
		url:'/update-chat',
		type:'POST',
		data:{id:id, message:msg},
		success:function(response){
			if(response.success){
				$('#editChatModal').modal('hide');
				$('#'+id).find('span').text(msg);
				$('#'+id).find('.fa-edit').attr('data-msg',msg);
				socket.emit('chatUpdated',{ id:id, message:msg });
			}
			else
				alert(response.msg);
		}
	});
});

socket.on('chatMessageUpdated', function(data){
	let id = data.id;
	let msg = data.message;
	$('#'+id).find('span').text(msg);
	$('#'+id).find('.fa-edit').attr('data-msg',msg);
})

$('.addMember').click(function(){

	let groupId = $(this).attr('data-id');
	let groupLimit = $(this).attr('data-limit');

	$('#group_id').val(groupId);
	$('#group_limit').val(groupLimit);

	$.ajax({
		url:'/get-members',
		type:'POST',
		data:{group_id: groupId, group_limit: groupLimit},
		success: function(response)
		{
			if(response.success){
				let users = response.data;
				let html = '';

				for(let i=0;i<users.length;i++){
					let isMemberOfGroup = users[i]['member'].length > 0 ? true : false;

					html += `
						<tr>
							<td>
								<input type="checkbox" `+ (isMemberOfGroup ? 'checked' : '') +` 
									name="members[]" value="`+users[i]['_id']+`">
							</td>
							<td>
								`+users[i]['name']+`
							</td>
						</tr>
					`;
				}

				$('.addMembersInTable').html(html);
			}
			else{
				alert(response.msg);
			}
		}
	});
});

/**
 * Add members form
 */
$('#add-member-form').submit(function(event){
	event.preventDefault();

	// Serialize the form data into a URL-encoded string
	let formData = $(this).serialize();

	$.ajax({
		url: "/add-members",
		type: "POST",
		data: formData,
		success: function(response){
			if(response.success){
				$('#membersModal').modal('hide');
				$('#add-member-form')[0].reset();
				alert(response.msg);
			}
			else{
				$('#add-member-error').text(response.msg);

				setTimeout(()=>{
					$('#add-member-error').text('');
				},3000);
			}
		}
	});
});
