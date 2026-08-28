output "cloudbase_env_id" {
  value = var.cloudbase_env_id
}

output "postgresql_instance_id" {
  value = tencentcloud_postgresql_instance.what_to_eat.id
}