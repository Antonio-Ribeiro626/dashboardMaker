<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['company_id','title','category','amount','expense_date'])]
class Expense extends Model
{
    use HasFactory;

    protected function casts(): array { return ['expense_date' => 'date', 'amount' => 'decimal:2']; }
}
