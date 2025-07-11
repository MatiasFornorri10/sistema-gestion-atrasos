create database prueba_db;
use prueba_db;

create table usuario(
	id_usuario int primary key auto_increment,
    nombre_usuario varchar(50)
);

insert into usuario(nombre_usuario) values ("fernando"), ("john");