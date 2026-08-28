variable "region" {
  type    = string
  default = "ap-guangzhou"
}

variable "cloudbase_env_id" {
  type        = string
  description = "Existing CloudBase environment ID."
}

variable "vpc_id" {
  type = string
}

variable "subnet_id" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}