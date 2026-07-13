<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name','industry','employees_count','vat','country','company_size','plan','logo'])]
class Company extends Model
{
    use HasFactory;
}
