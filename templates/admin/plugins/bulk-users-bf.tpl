<style>
	#bulk-users {
		border: 1px solid rgba(0, 0, 0, 0.1);
		height: 150px;
		padding: 0 6px;
	}

	#pending-invites td{
		vertical-align: middle;
	}
</style>
<form id="userinvitations">
	<div class="panel panel-default">
		<div class="panel-heading">Bulk create users</div>
		<div class="panel-body">
			<div class="form-group col-sm-12">
				<label for="new-user-invite-user">Format: "name;e-mail"</label>
				<textarea id="bulk-users" class="form-control" placeholder="Foo Bar;foo@bar.com"></textarea>
				<br>
				<button type="button" class="btn btn-primary" id="bulk-create">Create</button>
			</div>
		</div>
	</div>
</form>

