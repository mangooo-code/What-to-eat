resource "tencentcloud_postgresql_instance" "what_to_eat" {
  name              = "what-to-eat-postgres"
  availability_zone = "${var.region}"
  db_major_version  = "15"
  memory            = 4
  storage           = 50
  root_password     = var.db_password
  vpc_id            = var.vpc_id
  subnet_id         = var.subnet_id
}