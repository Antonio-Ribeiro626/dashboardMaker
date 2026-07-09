<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['company_id','title','message','type','is_read'])]
class Notification extends Model
{
    use HasFactory;

    protected function casts(): array { return ['is_read' => 'boolean']; }
}
